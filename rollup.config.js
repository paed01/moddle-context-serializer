import commonjs from '@rollup/plugin-commonjs';

export default {
  input: './src/index.js',
  plugins: [
    commonjs({
      sourceMap: false,
    }),
  ],
  output: [
    {
      file: './lib/main.cjs',
      format: 'cjs',
      exports: 'named',
      footer: 'module.exports = Object.assign(exports.default, exports);',
    },
  ],
};
