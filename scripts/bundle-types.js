/* eslint-disable no-console */
import fs from 'node:fs/promises';
import { createBundle } from 'dts-buddy';
import pkg from '../package.json' with { type: 'json' };

/**
 * @param {string} output absolute path of the bundle to write
 */
export async function buildTypes(output) {
  await createBundle({
    project: 'tsconfig.json',
    output,
    modules: { [pkg.name]: 'types/bundle.d.ts' },
  });
  return fs.readFile(output, 'utf8');
}

(async () => {
  if (import.meta.url === `file://${process.argv[1]}`) {
    await buildTypes('types/index.d.ts');
    console.log('Wrote types/index.d.ts');
  }
})();
