const blogRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user');
  response.json(blogs);
});

blogRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  if (!blog) {
    return response.status(404).end();
  }
  return response.json(blog);
});

blogRouter.post('/', async (request, response) => {
  const user = await User.findById(request.userId);

  const blog = new Blog(request.body);

  const savedBlog = await blog.save();

  const { _id } = savedBlog;
  user.blogs = user.blogs.concat(_id);
  await user.save();

  return response.status(201).json(savedBlog);
});

blogRouter.delete('/:id', async (request, response) => {
  const blog = await Blog.findById(request.userId);
  if (!(blog.user.toString() === request.userId.toString())) {
    return response.status(403).json({ error: 'forbidden: invalid user' });
  }

  await Blog.findByIdAndRemove(request.params.id);
  return response.status(204).end();
});

blogRouter.put('/:id', async (request, response) => {
  const blog = {
    ...request.body,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    blog,
    { new: true },
  );

  response.json(updatedBlog);
});

module.exports = blogRouter;
