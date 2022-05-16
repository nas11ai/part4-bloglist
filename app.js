const express = require('express');
const mongoose = require('mongoose');
require('express-async-errors');
const config = require('./utils/config');
const logger = require('./utils/logger');
const middleware = require('./utils/middleware');
const usersRouter = require('./controllers/users');
const blogRouter = require('./controllers/blogs');
const loginRouter = require('./controllers/login');

const app = express();

logger.info('connecting to', config.MONGODB_URI);

mongoose.connect(config.MONGODB_URI)
  .then(() => logger.info('connected to MongoDB'))
  .catch((error) => logger.error('error connecting to MongoDB', error.message));

app.use(express.json());
app.use(middleware.morgan('tiny'));
app.use(middleware.tokenExtractor);

app.use('/api/users', middleware.userValidator, usersRouter);
app.use('/api/blogs', blogRouter);
app.use('/api/login', loginRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
