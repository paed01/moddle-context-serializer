import factory from './helpers/factory.js';
import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';

import {default as Serializer, TypeResolver, deserialize} from '../index.js';

const typeResolver = TypeResolver(types);
const lanesSource = factory.resource('lane-set.bpmn');

describe('lanes', () => {
  let serializer;
  before(async () => {
    serializer = Serializer(await testHelpers.moddleContext(lanesSource), typeResolver);
  });

  it('lane set information is exposed under behaviour', async () => {
    const [bp] = serializer.getProcesses();
    expect(bp.behaviour).to.have.property('laneSets');

    const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
    const [dbp] = deserialized.getProcesses();
    expect(dbp.behaviour).to.have.property('laneSets');
  });

  it('lane information is added to activity', async () => {
    let element = serializer.getActivityById('task');
    expect(element).to.have.property('lane');

    const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
    element = deserialized.getActivityById('task');

    expect(element).to.have.property('lane').with.property('id');
    expect(element.lane).to.have.property('$type', 'bpmn:Lane');
    expect(element).to.have.property('lane').with.property('id');
  });
});
