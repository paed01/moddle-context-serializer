process.env.NODE_ENV = 'test';

module.exports = {
  recursive: true,
  reporter: 'spec',
  require: ['./test/helpers/setup.cjs'],
  timeout: 1000,
};
