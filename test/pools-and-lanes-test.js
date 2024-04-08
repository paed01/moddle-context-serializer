import factory from './helpers/factory.js';
import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';

import { default as Serializer, TypeResolver, deserialize } from '../index.js';

const typeResolver = TypeResolver(types);
const lanesSource = factory.resource('lane-set.bpmn');
const swimlanesSource = factory.resource('swimlanes.bpmn');

describe('lanes', () => {
  describe('lanes set', () => {
    let serializer;
    before(async () => {
      serializer = Serializer(await testHelpers.moddleContext(lanesSource), typeResolver);
    });

    it('lane set information is exposed under behaviour', () => {
      const [bp] = serializer.getProcesses();
      expect(bp.behaviour).to.have.property('laneSets');

      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      const [dbp] = deserialized.getProcesses();
      expect(dbp.behaviour).to.have.property('laneSets');
    });

    it('lane information is added to activity', () => {
      let element = serializer.getActivityById('task');
      expect(element).to.have.property('lane');

      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      element = deserialized.getActivityById('task');

      expect(element).to.have.property('lane').with.property('id');
      expect(element.lane).to.have.property('$type', 'bpmn:Lane');
      expect(element).to.have.property('lane').with.property('id');
    });
  });

  describe('swimlanes (same as lane sets)', () => {
    let serializer;
    before(async () => {
      serializer = Serializer(await testHelpers.moddleContext(swimlanesSource), typeResolver);
    });

    it('lane set information is exposed under process behaviour', () => {
      const [bp] = serializer.getProcesses();

      expect(bp.behaviour).to.have.property('laneSets').with.length(1);

      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      const [dbp] = deserialized.getProcesses();
      expect(dbp.behaviour).to.have.property('laneSets');
    });

    it('lanes are mapped to behaviour under process', () => {
      const [bp] = serializer.getProcesses();

      expect(bp.behaviour).to.have.property('lanes').with.length(2);

      for (const lane of bp.behaviour.lanes) {
        expect(lane).to.have.property('id').that.is.ok;
        expect(lane).to.have.property('type').that.equal('bpmn:Lane');
        expect(lane).to.have.property('behaviour');
        expect(lane.behaviour).to.have.property('documentation');
        expect(lane).to.have.property('Behaviour', types.Lane);
      }
    });

    it('lane information is added to activity', () => {
      let element = serializer.getActivityById('fillform');
      expect(element).to.have.property('lane');

      expect(element).to.have.property('lane').with.property('id');
      expect(element.lane).to.have.property('name', 'Customer');

      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      element = deserialized.getActivityById('fillform');

      expect(element).to.have.property('lane').with.property('id');
      expect(element.lane).to.have.property('$type', 'bpmn:Lane');
      expect(element).to.have.property('lane').with.property('id');
      expect(element.lane).to.have.property('name', 'Customer');
    });
  });
});
