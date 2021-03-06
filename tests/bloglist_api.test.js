const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../app');

const api = supertest(app);

const Blog = require('../models/blog');
const User = require('../models/user');
const helper = require('./bloglist_helper');

let token;

beforeEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('password', 10);
  const user = new User({
    username: 'root',
    name: 'superadmin',
    passwordHash,
  });
  const savedUser = await user.save();
  const userForToken = {
    username: savedUser.username,
    // eslint-disable-next-line no-underscore-dangle
    id: savedUser._id,
  };
  token = jwt.sign(userForToken, process.env.SECRET);

  // eslint-disable-next-line no-restricted-syntax
  for (const blog of helper.initialBlogs) {
    // eslint-disable-next-line no-underscore-dangle
    blog.user = savedUser._id;
    const blogObject = new Blog(blog);
    // eslint-disable-next-line no-await-in-loop
    await blogObject.save();
  }
});

describe('when there are initial blogs in db', () => {
  test('all blogs can be viewed', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });

  test('unique identifier property of the blog posts is named id', async () => {
    const firstBlogId = helper.initialBlogs[0].id;

    const response = await api.get(`/api/blogs/${firstBlogId}`);
    expect(response.body.id).toBe(firstBlogId);
  });

  test('a valid blog can be added', async () => {
    const newBlog = {
      title: 'The Subtle Art of Not Giving a F*ck',
      author: 'Mark Manson',
      url: 'https://www.amazon.com/Subtle-Art-Not-Giving-Counterintuitive/dp/0062457713',
      likes: 69,
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

    const titles = blogsAtEnd.map((blog) => blog.title);
    expect(titles).toContainEqual(
      'The Subtle Art of Not Giving a F*ck',
    );
  });

  test('if the likes property is missing from the request, it will default to the value 0', async () => {
    const newBlog = {
      title: 'The Subtle Art of Not Giving a F*ck',
      author: 'Mark Manson',
      url: 'https://www.amazon.com/Subtle-Art-Not-Giving-Counterintuitive/dp/0062457713',
    };

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    expect(response.body.likes).toBe(0);
  });

  test('If title and url are missing, respond with 400 bad request', async () => {
    const newBlog = {
      author: 'Mark Manson',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(400);
  });

  test('Success to delete a blog', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    const titles = blogsAtEnd.map((blog) => blog.title);

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1);
    expect(titles).not.toContainEqual(blogToDelete.title);
  });

  test('Success to add one like to a blog', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];
    const blogLikesBefore = blogToUpdate.likes;
    blogToUpdate.likes = blogLikesBefore + 1;

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(200);

    const blogsAtEnd = await helper.blogsInDb();
    const updatedBlog = blogsAtEnd[0];

    expect(updatedBlog.likes).toBe(blogLikesBefore + 1);
  });
});

describe('when there is only one user in db', () => {
  test('creation success with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const user = { username: 'newuser', name: 'user', password: 'password' };

    await api
      .post('/api/users')
      .send(user)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContainEqual(user.username);
  });

  test('creation fails with proper statuscode and message if username or password is not available', async () => {
    const usersAtStart = await helper.usersInDb();

    const user = { name: 'user' };

    await api
      .post('/api/users')
      .send(user)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const userAtEnd = await helper.usersInDb();

    expect(userAtEnd).toEqual(usersAtStart);
  });

  test('creation fails with proper statuscode and message if username or password is not at least 3 characters long', async () => {
    const usersAtStart = await helper.usersInDb();

    const user = { username: 'no', name: 'invalid user', password: 'no' };

    await api
      .post('/api/users')
      .send(user)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const userAtEnd = await helper.usersInDb();

    expect(userAtEnd).toEqual(usersAtStart);
  });

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb();

    const user = {
      username: 'root',
      name: 'Superuser',
      password: 'password',
    };

    const result = await api
      .post('/api/users')
      .send(user)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('username must be unique');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toEqual(usersAtStart);
  });
});

describe('when an user send a blog', () => {
  test('the blog must have id of the user who created it', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const usersInDb = await helper.usersInDb();
    const user = usersInDb[0];

    const newBlog = {
      title: 'The Subtle Art of Not Giving a F*ck',
      author: 'Mark Manson',
      url: 'https://www.amazon.com/Subtle-Art-Not-Giving-Counterintuitive/dp/0062457713',
      likes: 69,
      user: user.id,
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length + 1);

    const users = blogsAtEnd.map((b) => (
      b.user === undefined
        ? undefined
        : b.user.toString()
    ));
    expect(users).toContain(user.id);
  });

  test('user must have ids of blog that he/she has created', async () => {
    const usersAtStart = await helper.usersInDb();
    const user = usersAtStart[0];

    const newBlog = {
      title: 'The Subtle Art of Not Giving a F*ck',
      author: 'Mark Manson',
      url: 'https://www.amazon.com/Subtle-Art-Not-Giving-Counterintuitive/dp/0062457713',
      likes: 69,
      user: user.id,
    };

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd[0].blogs).toHaveLength(usersAtStart[0].blogs.length + 1);

    const blogsId = usersAtEnd[0].blogs.map((blog) => blog.toString());
    expect(blogsId).toContain(response.body.id);
  });
});

describe('when user login', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('password', 10);
    const user = new User({ username: 'root', passwordHash });

    await user.save();
  });

  test('succeess if username and password are exist in db', async () => {
    const usersInDb = await helper.usersInDb();
    const user = usersInDb[0];

    await api
      .post('/api/login')
      .send({ username: user.username, password: 'password' })
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('fails if username or password are not exist in db', async () => {
    const user = {
      username: 'invalidUsername',
      password: 'invalidPassword',
    };

    await api
      .post('/api/login')
      .send(user)
      .expect(401)
      .expect('Content-Type', /application\/json/);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
