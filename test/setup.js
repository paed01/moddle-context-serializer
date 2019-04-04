process.env.NODE_ENV = 'test';

require('@babel/register')({
  include: [
    '../index.js',
    '../test/**',
    '../node_modules/bpmn-moddle/**'
  ],
});

global.expect = require('chai').expect;
