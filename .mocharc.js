'use strict';

process.env.NODE_ENV = 'test';

global.expect = require('chai').expect;


require('@babel/register')({
  include: [
    '../index.js',
    '../test/**',
    '../node_modules/bpmn-moddle-5/**'
  ],
});

module.exports = {
  exit: true,
  recursive: true,
  reporter: 'spec',
  timeout: 1000,
};

