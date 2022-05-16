const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const logger = require('./logger');
const User = require('../models/user');

const unknownEndpoint = (request, response, next) => {
  response.status(404).send({ error: 'unknown endpoint' });

  return next();
};

const errorHandler = (error, request, response, next) => {
  logger.error(error.message);
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  }

  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  }

  if (error.name === 'JsonWebTokenError') {
    return response.status(400).json({ error: 'invalid token' });
  }

  return next(error);
};

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer')) {
    request.token = authorization.substring(7);
  }

  return next();
};

const userExtractor = (request, response, next) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!decodedToken) {
    return response.status(401).json({ error: 'token is missing or invalid' });
  }
  request.userId = decodedToken.id;

  return next();
};

const userValidator = async (request, response, next) => {
  const { username, password } = request.body;

  const existingUsername = await User.findOne({ username });

  if (!(username && password)) {
    return response.status(400).json({
      error: 'Username and password must exist',
    });
  }
  if (username.length < 3 || password.length < 3) {
    return response.status(400).json({
      error: 'Username and password must be at least 3 characters long',
    });
  }
  if (existingUsername) {
    return response.status(400).json({
      error: 'username must be unique',
    });
  }

  return next();
};

module.exports = {
  morgan,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
  userValidator,
};
