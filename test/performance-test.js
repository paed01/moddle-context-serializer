import factory from './helpers/factory';
import testHelpers from './helpers/testHelpers';
import types from './helpers/types';

import {default as Serializer, TypeResolver} from '../index';

const typeResolver = TypeResolver(types);
const largeSource = factory.resource('nested-joins.bpmn');

describe('performance', () => {
  let largeContext;
  before(async () => {
    largeContext = await testHelpers.moddleContext(largeSource);
  });

  it('getScripts returns empty array if serialized without scripts', async () => {
    const context = Serializer(largeContext, typeResolver);

    const activities = context.getActivities();

    for (const a of activities) {
      expect(context.getInboundSequenceFlows(a.id)).to.have.length.above(-1);
      expect(context.getOutboundSequenceFlows(a.id)).to.have.length.above(-1);
    }

    expect(activities).to.have.length.above(0);
  });
});
