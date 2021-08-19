import factory from './helpers/factory';
import types from './helpers/types';
import BpmnModdle5 from 'bpmn-moddle-5';
import BpmnModdle6 from 'bpmn-moddle-6';
import testHelpers from './helpers/testHelpers';

import {default as Serializer, TypeResolver, deserialize} from '../index';

const typeResolver = TypeResolver(types);

describe('backward compatibility', () => {
  describe('bpmn-moddle@5', () => {
    let moddleContext;
    before('load context', async () => {
      const source = factory.userTask();
      moddleContext = await new Promise((resolve, reject) => {
        const bpmnModdle = new BpmnModdle5();
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

  describe('version without dataStores', async () => {
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
