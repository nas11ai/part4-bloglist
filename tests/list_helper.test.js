const listHelper = require('../utils/list_helper');
const logger = require('../utils/logger');

test('dummy returns one', () => {
  const blogs = [];

  const result = listHelper.dummy(blogs);
  logger.info(result);
  expect(result).toBe(1);
});
