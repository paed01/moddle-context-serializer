import factory from './helpers/factory.js';
import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';

import {default as Serializer, TypeResolver} from '../index.js';

const typeResolver = TypeResolver(types);
const largeSource = factory.resource('nested-joins.bpmn');

describe('performance', () => {
  let largeContext;
  before(async () => {
    largeContext = await testHelpers.moddleContext(largeSource);
  });

  it('large source performance', async () => {
    const context = Serializer(largeContext, typeResolver);

    const activities = context.getActivities();

    for (const a of activities) {
      expect(context.getInboundSequenceFlows(a.id)).to.have.length.above(-1);
      expect(context.getOutboundSequenceFlows(a.id)).to.have.length.above(-1);
    }

    expect(activities).to.have.length.above(0);
  });
});
