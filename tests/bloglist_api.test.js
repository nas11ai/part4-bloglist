const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');

const api = supertest(app);

const Blog = require('../models/blog');
const helper = require('./bloglist_helper');

beforeEach(async () => {
  await Blog.deleteMany({});

  // eslint-disable-next-line no-restricted-syntax
  for (const blog of helper.initialBlogs) {
    const blogObject = new Blog(blog);
    // eslint-disable-next-line no-await-in-loop
    await blogObject.save();
  }
});

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

afterAll(() => {
  mongoose.connection.close();
});
