'use strict';

process.env.NODE_ENV = 'test';

global.expect = require('chai').expect;

module.exports = {
  recursive: true,
  reporter: 'spec',
  timeout: 1000,
};
