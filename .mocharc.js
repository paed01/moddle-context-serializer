'use strict';

process.env.NODE_ENV = 'test';

global.expect = require('chai').expect;

module.exports = {
  exit: true,
  recursive: true,
  reporter: 'spec',
  require: ['@babel/register'],
  timeout: 1000,
};

