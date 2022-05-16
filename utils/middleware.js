const morgan = require('morgan');
const logger = require('./logger');

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

module.exports = {
  morgan,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
};
