import factory from './helpers/factory';
import types from './helpers/types';
import BpmnModdle5 from 'bpmn-moddle-5';
import BpmnModdle6 from 'bpmn-moddle-6';

import {default as Serializer, TypeResolver} from '../index';

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
});
