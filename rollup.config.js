import commonjs from '@rollup/plugin-commonjs';

export default {
  input: './index.js',
  plugins: [
    commonjs({
      sourceMap: false,
    }),
  ],
  output: [
    {
      file: 'main.cjs',
      format: 'cjs',
      exports: 'named',
      footer: 'module.exports = Object.assign(exports.default, exports);',
    },
  ],
};
