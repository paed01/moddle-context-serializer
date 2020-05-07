'use strict';

process.env.NODE_ENV = 'test';

module.exports = {
  exit: true,
  recursive: true,
  reporter: 'spec',
  require: ['./test/setup.js'],
  timeout: 1000,
};

