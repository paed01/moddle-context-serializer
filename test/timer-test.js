import factory from './helpers/factory.js';
import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';

import {default as Serializer, TypeResolver, deserialize} from '../index.js';

const typeResolver = TypeResolver(types);
const camunda = testHelpers.getCamundaExtension();

describe('timers', () => {
  describe('a process with start cycle, bound timeout, and catch date, and user task with extension due date', () => {
    let moddleContext;
    before('load with extension', async () => {
      const source = factory.resource('timers.bpmn');
      moddleContext = await testHelpers.moddleContext(source, {
        camunda,
      });
    });

    it('getTimers() extracts known scripts', async () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const timers = serializer.getTimers();
      expect(timers.length).to.equal(3);
    });

    it('extracts timers with name, parent, and script format', async () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const timers = serializer.getTimers();

      for (const timer of timers) {
        expect(timer, timer.name).to.have.property('name');
        expect(timer, timer.name).to.have.property('parent');
        expect(timer.parent, timer.name).to.have.property('id');
        expect(timer.parent, timer.name).to.have.property('type');
        expect(timer, timer.name).to.have.property('timer').that.is.an('object');
        expect(timer.timer, timer.name).to.have.property('id').that.is.ok;
        expect(timer.timer, timer.name).to.have.property('timerType');
      }
    });

    it('deserialized also returns timers', () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const timers = serializer.getTimers();
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      expect(timers).to.deep.equal(deserialized.getTimers());
    });

    it('start event timer have timer name, type, and parent', async () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const [timer] = serializer.getTimers('bpmn:StartEvent');
      expect(timer).to.have.property('name');
      expect(timer).to.have.property('parent').that.deep.equal({
        id: 'start-cycle',
        type: 'bpmn:StartEvent',
      });
      expect(timer.timer).to.have.property('timerType', 'timeCycle');
      expect(timer.timer).to.have.property('value', 'R3/PT10H');
    });

    it('bound event timer have timer name, duration, and parent', async () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const [timer] = serializer.getTimers('bpmn:BoundaryEvent');
      expect(timer).to.have.property('name');
      expect(timer).to.have.property('parent').that.deep.equal({
        id: 'bound-duration',
        type: 'bpmn:BoundaryEvent',
      });
      expect(timer.timer).to.have.property('timerType', 'timeDuration');
      expect(timer.timer).to.have.property('value', 'PT1M');
    });

    it('catch event timer have timer name, date, and parent', async () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const [timer] = serializer.getTimers('bpmn:IntermediateCatchEvent');
      expect(timer).to.have.property('name');
      expect(timer).to.have.property('parent').that.deep.equal({
        id: 'catch-date',
        type: 'bpmn:IntermediateCatchEvent',
      });
      expect(timer.timer).to.have.property('timerType', 'timeDate');
      expect(timer.timer).to.have.property('value', '${date}');
    });

    it('user task with due date can be added to timers with extend function', async () => {
      const serializer = Serializer(moddleContext, typeResolver, extend);
      const [timer, ...rest] = serializer.getTimersByElementId('user-due');

      expect(timer).to.have.property('name', 'user-due/dueDate');
      expect(timer).to.have.property('parent').that.deep.equal({
        id: 'user-due',
        type: 'bpmn:UserTask',
      });
      expect(timer.timer).to.deep.equal({
        id: 'user-due_due',
        timerType: 'dueDate',
        value: '${dueDate}',
      });

      expect(rest).to.have.length(0);

      function extend(element, extendContext) {
        if (!element.dueDate) return;
        extendContext.addTimer(`${element.id}/dueDate`, {
          id: element.id + '_due',
          timerType: 'dueDate',
          value: element.dueDate,
        });
      }
    });
  });
});
