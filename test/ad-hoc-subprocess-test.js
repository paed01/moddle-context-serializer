import factory from './helpers/factory.js';
import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';

import { default as Serializer, TypeResolver } from '../src/index.js';

const typeResolver = TypeResolver(types);
const adhocSource = factory.resource('ad-hoc-subprocess.bpmn');

describe('Ad-hoc subprocess', () => {
  describe('child elements', () => {
    let serializer;
    before(async () => {
      const moddleContext = await testHelpers.moddleContext(adhocSource);
      serializer = Serializer(moddleContext, typeResolver);
    });

    it('getActivities(id) returns ad-hoc subprocess child elements', () => {
      expect(serializer.getActivities('adhoc')).to.have.length(4);
    });
  });
});
