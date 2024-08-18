import BpmnModdle6 from 'bpmn-moddle-6';
import BpmnModdle7 from 'bpmn-moddle-7';
import factory from './helpers/factory.js';
import types from './helpers/types.js';
import testHelpers from './helpers/testHelpers.js';

import { default as Serializer, TypeResolver, deserialize } from '../index.js';

const typeResolver = TypeResolver(types);

describe('backward compatibility', () => {
  describe('bpmn-moddle@6', () => {
    let moddleContext;
    before('load context', async () => {
      const source = factory.userTask();
      moddleContext = await new Promise((resolve, reject) => {
        const bpmnModdle = new BpmnModdle6();
        return bpmnModdle.fromXML(source, (err, definitions, ctx) => {
          if (err) return reject(err);
          resolve(ctx);
        });
      });
    });

    it('returns processes', () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(1);
    });
  });

  describe('bpmn-moddle@7', () => {
    let moddleContext;
    before('load context', async () => {
      const source = factory.userTask();
      const bpmnModdle = new BpmnModdle7();
      moddleContext = await bpmnModdle.fromXML(source);
    });

    it('returns processes', () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(1);
    });
  });

  describe('camunda-bpmn-moddle@6', () => {
    let moddleContext, moddleContext6;
    before('load context', async () => {
      const source = factory.resource('scripts.bpmn');
      moddleContext = await testHelpers.moddleContext(source, {
        camunda: testHelpers.getCamundaExtension(),
      });
      moddleContext6 = await testHelpers.moddleContext(source, {
        camunda: testHelpers.getCamundaExtension('camunda-bpmn-moddle-6'),
      });
    });

    it('returns the same serialized context as latest version', () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const serializer6 = Serializer(moddleContext6, typeResolver);

      expect(serializer.serialize()).to.equal(serializer6.serialize());
    });
  });

  describe('version without dataStores', () => {
    it('handles missing dataStores property', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        id="Definitions_1ke2tm6"
        targetNamespace="http://bpmn.io/schema/bpmn">
        <process id="Process_15ozyjy" isExecutable="true">
          <startEvent id="start" />
          <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
          <task id="task" />
        </process>
       </definitions>
      `;
      const moddleContext = await testHelpers.moddleContext(source);

      const serializer = Serializer(moddleContext, typeResolver);
      const serialized = serializer.serialize();

      let parsed = JSON.parse(serialized);
      expect(parsed).to.have.property('dataStores').with.length(0);
      delete parsed.dataStores;
      expect(parsed).to.not.have.property('dataStores');

      const deserialized = deserialize(parsed, typeResolver);
      expect(deserialized.getDataStoreReferences(), 'deserialized dataStores').to.have.property('length', 0);

      parsed = JSON.parse(serializer.serialize());
      expect(parsed).to.have.property('dataStores').with.length(0);
    });
  });
});
