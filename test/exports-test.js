import { createRequire } from 'node:module';

import * as mod from 'moddle-context-serializer';

const nodeRequire = createRequire(import.meta.url);

describe('package exports', () => {
  it('exposes Serializer as a named export', () => {
    expect(mod.Serializer).to.be.a('function');
  });

  it('does not expose a default export', () => {
    expect(mod).to.not.have.property('default');
  });

  it('exposes the documented named API', () => {
    expect(mod.TypeResolver).to.be.a('function');
    expect(mod.deserialize).to.be.a('function');
    expect(mod.map).to.be.a('function');
    expect(mod.SerializableContext).to.be.a('function');
    expect(mod.resolveTypes).to.be.a('function');
  });

  it('a CommonJS host requires the same ES module as an import', () => {
    const required = nodeRequire('moddle-context-serializer');

    expect(required).to.not.have.property('default');
    for (const name of Object.keys(mod)) {
      expect(required[name], name).to.equal(mod[name]);
    }
  });
});
