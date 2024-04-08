import factory from './helpers/factory.js';
import fs from 'fs';
import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';
import { default as Serializer, TypeResolver, deserialize, map } from '../index.js';

const lanesSource = factory.resource('lanes.bpmn');
const subProcessSource = factory.resource('sub-process.bpmn');
const twoProcessesSource = factory.resource('two-executable-processes.bpmn');
const conditionAndEscalationSource = factory.resource('condition-and-escalation.bpmn');
const eventDefinitionSource = factory.resource('bound-error-and-timer.bpmn');

const typeResolver = TypeResolver(types);

describe('moddle context serializer', () => {
  let lanesModdleContext,
    lanesModdleContextFromCallBack,
    subProcessModdleContext,
    eventDefinitionModdleContext,
    twoProcessesModdleContext,
    conditionAndEscalationModdleContext,
    signalEventModdleContext,
    messageFlowModdleContext,
    compensationContext,
    timersModdleContext,
    conditionalFlows;
  before(async () => {
    lanesModdleContext = await testHelpers.moddleContext(lanesSource);
    lanesModdleContextFromCallBack = JSON.parse(fs.readFileSync('./test/resources/lanes-old-callback-context.json'));
    subProcessModdleContext = await testHelpers.moddleContext(subProcessSource);
    eventDefinitionModdleContext = await testHelpers.moddleContext(eventDefinitionSource);
    conditionAndEscalationModdleContext = await testHelpers.moddleContext(conditionAndEscalationSource);
    twoProcessesModdleContext = await testHelpers.moddleContext(twoProcessesSource);
    signalEventModdleContext = await testHelpers.moddleContext(factory.resource('signal-event.bpmn'));
    messageFlowModdleContext = await testHelpers.moddleContext(factory.resource('message-flows.bpmn'));
    compensationContext = await testHelpers.moddleContext(factory.resource('bound-compensation.bpmn'));
    timersModdleContext = await testHelpers.moddleContext(factory.resource('timers.bpmn'));
    conditionalFlows = await testHelpers.moddleContext(factory.resource('conditional-flows.bpmn'));
  });

  describe('TypeResolver(types[, extender])', () => {
    let serializer;
    before(() => {
      serializer = Serializer(lanesModdleContext, typeResolver);
    });

    it('holds definition id, type, and name', () => {
      expect(serializer).to.have.property('id', 'Definitions_1');
      expect(serializer).to.have.property('type', 'bpmn:Definitions');
      expect(serializer).to.have.property('name', 'Lanes');
    });

    it('returns the expected api', () => {
      expect(serializer).to.have.property('getActivities').that.is.a('function');
      expect(serializer).to.have.property('getActivityById').that.is.a('function');
      expect(serializer).to.have.property('getAssociations').that.is.a('function');
      expect(serializer).to.have.property('getAssociationById').that.is.a('function');
      expect(serializer).to.have.property('getDataObjects').that.is.a('function');
      expect(serializer).to.have.property('getInboundSequenceFlows').that.is.a('function');
      expect(serializer).to.have.property('getMessageFlows').that.is.a('function');
      expect(serializer).to.have.property('getOutboundSequenceFlows').that.is.a('function');
      expect(serializer).to.have.property('getProcessById').that.is.a('function');
      expect(serializer).to.have.property('getProcesses').that.is.a('function');
      expect(serializer).to.have.property('getExecutableProcesses').that.is.a('function');
      expect(serializer).to.have.property('getSequenceFlowById').that.is.a('function');
      expect(serializer).to.have.property('getSequenceFlows').that.is.a('function');
      expect(serializer).to.have.property('serialize').that.is.a('function');
    });

    it('executes passed extender function with default type mapping', async () => {
      function Escalation() {}
      function IntermediateThrowEvent() {}
      function EscalationEventDefinition() {}

      const myTypeResolver = TypeResolver(types, (activityTypes) => {
        activityTypes['bpmn:Escalation'] = Escalation;
        activityTypes['bpmn:IntermediateThrowEvent'] = IntermediateThrowEvent;
        activityTypes['bpmn:EscalationEventDefinition'] = EscalationEventDefinition;
      });

      const moddleContext = await testHelpers.moddleContext(factory.resource('escalation.bpmn'));

      const extendedSerializer = Serializer(moddleContext, myTypeResolver);

      const event = extendedSerializer.getActivityById('intermediateThrowEvent_1');
      expect(event).to.be.ok;
      expect(event).to.have.property('Behaviour', IntermediateThrowEvent);
      expect(event).to.have.property('behaviour').with.property('eventDefinitions').with.length(1);

      expect(event.behaviour.eventDefinitions[0]).to.have.property('Behaviour', EscalationEventDefinition);

      const escalation = extendedSerializer.getActivityById('escalation_1');
      expect(escalation).to.be.ok;
      expect(escalation).to.have.property('Behaviour', Escalation);
      expect(escalation.behaviour).to.have.property('escalationCode', '10');
    });
  });

  describe('serialize()', () => {
    it('returns stringified copy of mapped context', () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      const serialized = JSON.parse(serializer.serialize());

      expect(serialized).to.have.property('id').that.is.ok;
      expect(serialized).to.have.property('type').that.is.ok;
      expect(serialized).to.have.property('activities').that.is.an('array');
      expect(serialized).to.have.property('dataObjects').that.is.an('array');
      expect(serialized).to.have.property('definition').that.is.an('object').and.ok;
      expect(serialized).to.have.property('messageFlows').that.is.an('array');
      expect(serialized).to.have.property('processes').that.is.an('array');
      expect(serialized).to.have.property('sequenceFlows').that.is.an('array');
    });

    it('(backward compability) returns stringified copy of mapped old callback context', () => {
      const serializer = Serializer(lanesModdleContextFromCallBack, typeResolver);
      const serialized = JSON.parse(serializer.serialize());

      expect(serialized).to.have.property('id').that.is.ok;
      expect(serialized).to.have.property('type').that.is.ok;
      expect(serialized).to.have.property('activities').that.is.an('array');
      expect(serialized).to.have.property('dataObjects').that.is.an('array');
      expect(serialized).to.have.property('definition').that.is.an('object').and.ok;
      expect(serialized).to.have.property('messageFlows').that.is.an('array');
      expect(serialized).to.have.property('processes').that.is.an('array');
      expect(serialized).to.have.property('sequenceFlows').that.is.an('array');
    });
  });

  describe('deserialize(deserializedContext, typeResolver)', () => {
    it('holds definition id, type, and name', () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      expect(deserialized).to.have.property('id', 'Definitions_1');
      expect(deserialized).to.have.property('type', 'bpmn:Definitions');
      expect(deserialized).to.have.property('name', 'Lanes');
    });

    it('(backward compability) holds definition id, type, and name', () => {
      const serializer = Serializer(lanesModdleContextFromCallBack, typeResolver);
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      expect(deserialized).to.have.property('id', 'Definitions_1');
      expect(deserialized).to.have.property('type', 'bpmn:Definitions');
      expect(deserialized).to.have.property('name', 'Lanes');
    });

    it('has the expected api', () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      expect(deserialized).to.have.property('getActivities').that.is.a('function');
      expect(deserialized).to.have.property('getActivities').that.is.a('function');
      expect(deserialized).to.have.property('getActivityById').that.is.a('function');
      expect(deserialized).to.have.property('getDataObjects').that.is.a('function');
      expect(deserialized).to.have.property('getInboundSequenceFlows').that.is.a('function');
      expect(deserialized).to.have.property('getMessageFlows').that.is.a('function');
      expect(deserialized).to.have.property('getOutboundSequenceFlows').that.is.a('function');
      expect(deserialized).to.have.property('getProcessById').that.is.a('function');
      expect(deserialized).to.have.property('getProcesses').that.is.a('function');
      expect(deserialized).to.have.property('getExecutableProcesses').that.is.a('function');
      expect(deserialized).to.have.property('getSequenceFlowById').that.is.a('function');
      expect(deserialized).to.have.property('getSequenceFlows').that.is.a('function');
      expect(deserialized).to.have.property('serialize').that.is.a('function');
    });

    it('has entities with Behaviour', () => {
      let serializer = Serializer(eventDefinitionModdleContext, typeResolver);
      let deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      deserialized.getProcesses().forEach(assertEntity);
      deserialized.getActivities().forEach(assertEntity);
      deserialized.getDataObjects().forEach(assertEntity);
      deserialized.getMessageFlows().forEach(assertEntity);

      serializer = Serializer(lanesModdleContext, typeResolver);
      deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      deserialized.getProcesses().forEach(assertEntity);
      deserialized.getActivities().forEach(assertEntity);
      deserialized.getDataObjects().forEach(assertEntity);
      deserialized.getMessageFlows().forEach(assertEntity);

      serializer = Serializer(subProcessModdleContext, typeResolver);
      deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      deserialized.getProcesses().forEach(assertEntity);
      deserialized.getActivities().forEach(assertEntity);
      deserialized.getDataObjects().forEach(assertEntity);
      deserialized.getMessageFlows().forEach(assertEntity);
    });
  });

  describe('map(moddleContext[, extendFn])', () => {
    it('returns mapped context', () => {
      const mapped = map(subProcessModdleContext);

      expect(mapped).to.have.property('definition').that.is.an('object');
      expect(mapped).to.have.property('activities').that.is.an('array');
      expect(mapped).to.have.property('associations').that.is.an('array');
      expect(mapped).to.have.property('dataObjects').that.is.an('array');
      expect(mapped).to.have.property('dataStores').that.is.an('array');
      expect(mapped).to.have.property('messageFlows').that.is.an('array');
      expect(mapped).to.have.property('processes').that.is.an('array');
      expect(mapped).to.have.property('sequenceFlows').that.is.an('array');
      expect(mapped).to.have.property('scripts').that.is.an('array');
      expect(mapped).to.have.property('timers').that.is.an('array');
    });
  });

  describe('getProcesses()', () => {
    it('returns processes', () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(2);

      processes.forEach(assertEntity);
    });

    it('returns processes only', () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(1);
    });

    it('isExecutable is available in behaviour', () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(2);

      expect(processes[0]).to.have.property('behaviour').with.property('isExecutable', true);
      expect(processes[1]).to.have.property('behaviour').with.property('isExecutable', false);
    });

    it('(backward compability) isExecutable is available in behaviour', () => {
      const serializer = Serializer(lanesModdleContextFromCallBack, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(2);

      expect(processes[0]).to.have.property('behaviour').with.property('isExecutable', true);
      expect(processes[1]).to.have.property('behaviour').with.property('isExecutable', false);
    });

    it('returns only processes', () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      const processes = serializer.getProcesses();

      expect(processes).to.have.length(1);

      expect(processes[0]).to.have.property('type', 'bpmn:Process');
    });
  });

  describe('getExecutableProcesses()', () => {
    it('returns executable processes', () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      const executableProcesses = serializer.getExecutableProcesses();
      const processes = serializer.getProcesses();

      expect(executableProcesses).to.have.length(1);
      expect(processes).to.have.length(2);
      expect(executableProcesses[0]).to.have.property('id', 'mainProcess');
      expect(executableProcesses[0]).to.have.property('behaviour').with.property('isExecutable', true);
    });

    it('returns all executable processes', () => {
      const serializer = Serializer(twoProcessesModdleContext, typeResolver);
      const processes = serializer.getExecutableProcesses();

      expect(processes).to.have.length(2);
      expect(processes[0]).to.have.property('behaviour').with.property('isExecutable', true);
      expect(processes[1]).to.have.property('behaviour').with.property('isExecutable', true);
    });
  });

  describe('getProcessesById(id)', () => {
    it('returns process with id', () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      expect(serializer.getProcessById('mainProcess')).to.be.ok;
      expect(serializer.getProcessById('participantProcess')).to.be.ok;
    });

    it('returns nothing if not found', () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      expect(serializer.getProcessById('subProcess')).to.not.be.ok;
    });
  });

  describe('getActivities([scopeId])', () => {
    it('returns all activities', () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);

      const activities = serializer.getActivities();

      expect(activities).to.have.length(5);

      activities.forEach(assertEntity);
    });

    it('with scope returns activities for given process or sub process', () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);

      const processActivities = serializer.getActivities('mainProcess');
      expect(processActivities).to.have.length(3);
      processActivities.forEach((activity) => {
        assertEntity(activity);
        expect(activity.parent).to.have.property('id', 'mainProcess');
      });

      const subProcessActivities = serializer.getActivities('subProcess');

      expect(subProcessActivities).to.have.length(2);
      subProcessActivities.forEach((activity) => {
        assertEntity(activity);
        expect(activity.parent).to.have.property('id', 'subProcess');
      });
    });
  });

  describe('getSequenceFlows([scopeId])', () => {
    let serializer;
    before(() => {
      serializer = Serializer(lanesModdleContext, typeResolver);
    });

    it('returns all sequence flows', () => {
      expect(serializer.getSequenceFlows()).to.have.length(6);
    });

    it('flows have the expected properties', () => {
      const flows = serializer.getSequenceFlows();
      flows.forEach(assertSequenceFlow);
    });

    it('with scope id returns sequence flows belonging to scope', () => {
      expect(serializer.getSequenceFlows('mainProcess')).to.have.length(3);
      expect(serializer.getSequenceFlows('participantProcess')).to.have.length(3);
    });
  });

  describe('getSequenceFlowById(id)', () => {
    it('returns sequence flow with id', () => {
      const serializer = Serializer(lanesModdleContext, typeResolver);
      expect(serializer.getSequenceFlowById('flow1')).to.be.ok;
      expect(serializer.getSequenceFlowById('flow-p-1')).to.be.ok;
    });

    it('returns nothing if not found', () => {
      const serializer = Serializer(subProcessModdleContext, typeResolver);
      expect(serializer.getSequenceFlowById('subProcess')).to.not.be.ok;
    });
  });

  describe('getOutboundSequenceFlows(activityId)', () => {
    let serializer;
    before(async () => {
      serializer = Serializer(await testHelpers.moddleContext(factory.valid()), typeResolver);
    });

    it('returns activity outbound sequence flows', () => {
      const flows = serializer.getOutboundSequenceFlows('theStart');
      expect(flows).to.have.length(1);
      flows.forEach(assertSequenceFlow);
    });

    it('returns all outbound', () => {
      const flows = serializer.getOutboundSequenceFlows('decision');
      expect(flows).to.have.length(2);
    });

    it('empty array if non found', () => {
      const flows = serializer.getOutboundSequenceFlows('end1');
      expect(flows).to.have.length(0);
    });

    it('marks default sequence flows', () => {
      const flows = serializer.getOutboundSequenceFlows('decision');
      expect(flows).to.have.length(2);
      expect(flows[0]).to.have.property('isDefault', true);
    });

    it('conditional flow returns condition in behaviour', () => {
      const flows = serializer.getOutboundSequenceFlows('decision');
      expect(flows).to.have.length(2);
      expect(flows[1]).to.have.property('behaviour').with.property('conditionExpression');
    });

    it('contains only sequence flows', () => {
      const flows = Serializer(lanesModdleContext, typeResolver).getOutboundSequenceFlows('task1');
      expect(flows).to.have.length(1);
      expect(flows[0]).to.have.property('type', 'bpmn:SequenceFlow');
    });

    it('default flow is returned on task', () => {
      const flows = Serializer(conditionalFlows, typeResolver).getOutboundSequenceFlows('task1');
      expect(flows).to.have.length(3);
      expect(flows.some((f) => f.isDefault)).to.be.true;
    });
  });

  describe('getInboundSequenceFlows()', () => {
    let contextMapper;
    before(async () => {
      contextMapper = Serializer(await testHelpers.moddleContext(factory.valid()), typeResolver);
    });

    it('returns activity inbound sequence flows', () => {
      const flows = contextMapper.getInboundSequenceFlows('end2');
      expect(flows).to.have.length(1);
      flows.forEach(assertSequenceFlow);
    });

    it('empty array if non found', () => {
      const flows = contextMapper.getInboundSequenceFlows('theStart');
      expect(flows).to.have.length(0);
    });

    it('returns inbound for sub process', () => {
      const flows = Serializer(subProcessModdleContext, typeResolver).getInboundSequenceFlows('subProcess');
      expect(flows).to.have.length(1);
    });

    it('main process doesn´t return inbound for sub process', () => {
      const flows = Serializer(subProcessModdleContext, typeResolver).getInboundSequenceFlows('mainProcess');
      expect(flows).to.have.length(0);
    });

    it('returns sequence flows only', () => {
      const flows = Serializer(lanesModdleContext, typeResolver).getInboundSequenceFlows('intermediate');
      expect(flows).to.have.length(1);
      expect(flows[0]).to.have.property('type', 'bpmn:SequenceFlow');
    });
  });

  describe('getMessageFlows()', () => {
    let laneSerializer;
    before(() => {
      laneSerializer = Serializer(lanesModdleContext, typeResolver);
    });

    it('with scope returns all outbound message flows from scope (process)', () => {
      const flows = laneSerializer.getMessageFlows('mainProcess');
      expect(flows).to.have.length(1);
      expect(flows[0]).to.have.property('type', 'bpmn:MessageFlow');
      expect(flows[0]).to.have.property('Behaviour', types.MessageFlow);
    });

    it('without scope returns all message flows', () => {
      const flows = laneSerializer.getMessageFlows();
      expect(flows).to.have.length(2);

      expect(flows[0]).to.have.property('type', 'bpmn:MessageFlow');
      expect(flows[0]).to.have.property('id', 'fromMainTaskMessageFlow');
      expect(flows[0]).to.have.property('source').that.eql({
        processId: 'mainProcess',
        id: 'task1',
      });
      expect(flows[0]).to.have.property('target').that.eql({
        processId: 'participantProcess',
        id: 'messageStartEvent',
      });
      expect(flows[0]).to.have.property('Behaviour', types.MessageFlow);

      expect(flows[1]).to.have.property('type', 'bpmn:MessageFlow');
      expect(flows[1]).to.have.property('id', 'fromCompleteTaskMessageFlow');
      expect(flows[1]).to.have.property('source').that.eql({
        processId: 'participantProcess',
        id: 'completeTask',
      });
      expect(flows[1]).to.have.property('target').that.eql({
        processId: 'mainProcess',
        id: 'intermediate',
      });
      expect(flows[1]).to.have.property('Behaviour', types.MessageFlow);
    });

    it('message flow targeting empty participant is ok', async () => {
      const source = `
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:js="http://paed01.github.io/bpmn-engine/schema/2017/08/bpmn">
        <collaboration id="Collaboration_0">
          <messageFlow id="fromMain2Participant" sourceRef="send" targetRef="part2" />
          <messageFlow id="fromParticipant2Main" sourceRef="part2" targetRef="receive" />
          <participant id="lane1" name="Main" processRef="mainProcess" />
          <participant id="part2" name="Participant" processRef="participantProcess" />
        </collaboration>
        <process id="mainProcess" isExecutable="true">
          <startEvent id="start1" />
          <sequenceFlow id="toTask" sourceRef="start" targetRef="send" />
          <intermediateThrowEvent id="send">
            <messageEventDefinition messageRef="Message1" />
          </intermediateThrowEvent>
          <sequenceFlow id="toTask" sourceRef="start" targetRef="receive" />
          <intermediateCatchEvent id="receive">
            <messageEventDefinition messageRef="Message2" />
          </intermediateCatchEvent>
        </process>
        <process id="participantProcess" />
        <message id="Message1" name="Start message" />
        <message id="Message2" name="Second message" />
      </definitions>`;

      const moddleContext = await testHelpers.moddleContext(source);
      const serializer = Serializer(moddleContext, typeResolver);

      const messageFlows = serializer.getMessageFlows();
      expect(messageFlows).to.have.length(2);

      const [fromMain, fromParticipant] = messageFlows;
      expect(fromMain).to.have.property('source').that.eql({
        processId: 'mainProcess',
        id: 'send',
      });
      expect(fromMain).to.have.property('target').that.eql({
        participantId: 'part2',
        participantName: 'Participant',
        processId: 'participantProcess',
      });

      expect(fromParticipant).to.have.property('source').that.eql({
        participantId: 'part2',
        participantName: 'Participant',
        processId: 'participantProcess',
      });
      expect(fromParticipant).to.have.property('target').that.eql({
        processId: 'mainProcess',
        id: 'receive',
      });
    });

    it('message flow targeting non-existing element doesn´t throw', async () => {
      const source = `
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:js="http://paed01.github.io/bpmn-engine/schema/2017/08/bpmn">
        <collaboration id="Collaboration_0">
          <messageFlow id="fromMain2Participant" sourceRef="send" targetRef="whoami" />
        </collaboration>
        <process id="mainProcess" isExecutable="true">
          <startEvent id="start1" />
          <sequenceFlow id="toTask" sourceRef="start" targetRef="send" />
          <intermediateThrowEvent id="send">
            <messageEventDefinition messageRef="Message1" />
          </intermediateThrowEvent>
        </process>
        <message id="Message1" name="Start message" />
      </definitions>`;

      const moddleContext = await testHelpers.moddleContext(source);
      const serializer = Serializer(moddleContext, typeResolver);

      const messageFlows = serializer.getMessageFlows();
      expect(messageFlows).to.have.length(1);

      const [fromMain] = messageFlows;
      expect(fromMain).to.have.property('source').that.eql({
        processId: 'mainProcess',
        id: 'send',
      });
      expect(fromMain).to.have.property('target', undefined);
    });
  });

  describe('getAssociations(scopeId)', () => {
    let serializer;
    before(() => {
      serializer = Serializer(compensationContext, typeResolver);
    });

    it('with scope returns associations for scope (process)', () => {
      const flows = serializer.getAssociations('Process_0');
      expect(flows).to.have.length(2);
      expect(flows[0]).to.have.property('type', 'bpmn:Association');
      expect(flows[0]).to.have.property('Behaviour', types.Association);
      expect(flows[1]).to.have.property('type', 'bpmn:Association');
      expect(flows[1]).to.have.property('Behaviour', types.Association);
    });

    it('without scope returns all associations from scope (process)', () => {
      const flows = serializer.getAssociations();
      expect(flows).to.have.length(2);
      expect(flows[0]).to.have.property('type', 'bpmn:Association');
      expect(flows[0]).to.have.property('Behaviour', types.Association);
      expect(flows[1]).to.have.property('type', 'bpmn:Association');
      expect(flows[1]).to.have.property('Behaviour', types.Association);
    });

    it('with unknown scope returns no associations', () => {
      const flows = serializer.getAssociations('Def');
      expect(flows).to.have.length(0);
    });
  });

  describe('getExtendContext()', () => {
    let serializer;
    before(() => {
      serializer = Serializer(compensationContext, typeResolver);
    });

    it('returns scripts and timers', () => {
      const context = serializer.getExtendContext();
      expect(context).to.have.property('scripts').that.is.an('array');
      expect(context).to.have.property('timers').that.is.an('array');
    });

    it('and add functions', () => {
      const context = serializer.getExtendContext();
      expect(context).to.have.property('addScript').that.is.a('function');
      expect(context).to.have.property('addTimer').that.is.a('function');
    });

    it('add function with empty body is ok, but to what end?', () => {
      const context = serializer.getExtendContext();
      context.addScript('foo', {});
      context.addTimer('bar', {});

      expect(context.scripts).to.have.length(1);
      expect(context.timers).to.have.length(1);
    });
  });

  describe('Service implementation', () => {
    const source = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <serviceTask id="service" implementation="\${environment.services.request}" />
        <serviceTask id="dummyService" />
        <sendTask id="send" implementation="\${environment.services.request}" />
        <userTask id="user" implementation="\${environment.services.request}" />
        <businessRuleTask id="rule" implementation="\${environment.services.rule}" />
      </process>
    </definitions>`;

    let contextMapper;
    before(async () => {
      const moddleContext = await testHelpers.moddleContext(source);
      contextMapper = Serializer(moddleContext, typeResolver);
    });

    it('ServiceTask receives service implementation', () => {
      const activity = contextMapper.getActivityById('service');
      expect(activity.behaviour).to.have.property('Service', types.ServiceImplementation);
    });

    it('ServiceTask without implementation receives no implementation', () => {
      const activity = contextMapper.getActivityById('dummyService');
      expect(activity.behaviour).to.not.have.property('Service');
    });

    it('SendTask receives service implementation', () => {
      const activity = contextMapper.getActivityById('send');
      expect(activity.behaviour).to.have.property('Service', types.ServiceImplementation);
    });

    it('BusinessRuleTask receives service implementation', () => {
      const activity = contextMapper.getActivityById('rule');
      expect(activity.behaviour).to.have.property('Service', types.ServiceImplementation);
    });

    it('UserTask receives service implementation', () => {
      const activity = contextMapper.getActivityById('user');
      expect(activity.behaviour).to.have.property('Service', types.ServiceImplementation);
    });
  });

  describe('Task loop', () => {
    const source = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <task id="multiInstance">
          <multiInstanceLoopCharacteristics>
            <loopCardinality>\${environment.variables.maxCardinality}</loopCardinality>
            <completionCondition xsi:type="bpmn:tFormalExpression">\${environment.services.completed}</completionCondition>
          </multiInstanceLoopCharacteristics>
        </task>
        <task id="standardLoop">
          <standardLoopCharacteristics testBefore="true" loopMaximum="3">
            <loopCondition xsi:type="bpmn:tFormalExpression">\${environment.services.completed}</loopCondition>
          </standardLoopCharacteristics>
        </task>
      </process>
    </definitions>`;

    let contextMapper;
    before(async () => {
      const moddleContext = await testHelpers.moddleContext(source);
      contextMapper = Serializer(moddleContext, typeResolver);
    });

    it('MultiInstanceLoopCharacteristics is added to task behaviour', () => {
      const activity = contextMapper.getActivityById('multiInstance');

      expect(activity.behaviour).to.have.property('loopCharacteristics').with.property('Behaviour', types.MultiInstanceLoopCharacteristics);
      expect(activity.behaviour.loopCharacteristics.behaviour).to.have.property(
        'loopCardinality',
        '${environment.variables.maxCardinality}',
      );
      expect(activity.behaviour.loopCharacteristics.behaviour).to.have.property('completionCondition', '${environment.services.completed}');
    });

    it('MultiInstanceLoopCharacteristics is deserializable', async () => {
      const serializer = Serializer(await testHelpers.moddleContext(source), typeResolver);
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      const activity = deserialized.getActivityById('multiInstance');

      expect(activity.behaviour).to.have.property('loopCharacteristics').with.property('Behaviour', types.MultiInstanceLoopCharacteristics);
      expect(activity.behaviour.loopCharacteristics.behaviour).to.have.property(
        'loopCardinality',
        '${environment.variables.maxCardinality}',
      );
      expect(activity.behaviour.loopCharacteristics.behaviour).to.have.property('completionCondition', '${environment.services.completed}');
    });

    it('StandardLoopCharacteristics is added to task behaviour', () => {
      const activity = contextMapper.getActivityById('standardLoop');

      expect(activity.behaviour).to.have.property('loopCharacteristics').with.property('Behaviour', types.StandardLoopCharacteristics);
      expect(activity.behaviour.loopCharacteristics.behaviour).to.have.property('testBefore', true);
      expect(activity.behaviour.loopCharacteristics.behaviour).to.have.property('loopMaximum', 3);
      expect(activity.behaviour.loopCharacteristics.behaviour).to.have.property('loopCondition', '${environment.services.completed}');
    });

    it('StandardLoopCharacteristics is deserializable', async () => {
      const serializer = Serializer(await testHelpers.moddleContext(source), typeResolver);
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      const activity = deserialized.getActivityById('standardLoop');

      expect(activity.behaviour).to.have.property('loopCharacteristics').with.property('Behaviour', types.StandardLoopCharacteristics);
      expect(activity.behaviour.loopCharacteristics.behaviour).to.have.property('testBefore', true);
      expect(activity.behaviour.loopCharacteristics.behaviour).to.have.property('loopMaximum', 3);
      expect(activity.behaviour.loopCharacteristics.behaviour).to.have.property('loopCondition', '${environment.services.completed}');
    });
  });

  ['subProcess', 'transaction'].forEach((type) => {
    describe(type, () => {
      let contextMapper;
      before(async () => {
        const source = `<?xml version="1.0" encoding="UTF-8"?>
        <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="task-definitions" targetNamespace="http://bpmn.io/schema/bpmn">
          <process id="Process_1" isExecutable="true">
            <${type} id="activity">
              <startEvent id="start" />
              <sequenceFlow id="toTask" sourceRef="start" targetRef="end" />
              <userTask id="task" />
              <sequenceFlow id="toEnd" sourceRef="task" targetRef="end" />
              <endEvent id="end" />
            </${type}>
            <${type} id="empty-activity">
              <ioSpecification><dataInput id="activityInput" />
                <dataOutput id="activityOutput" />
              </ioSpecification>
              <dataInputAssociation id="dataInputAssociation">
                <sourceRef>activityInput</sourceRef>
                <targetRef>myDataRef</targetRef>
              </dataInputAssociation>
              <dataOutputAssociation id="dataOutputAssociation">
                <sourceRef>activityOutput</sourceRef>
                <targetRef>myDataRef</targetRef>
              </dataOutputAssociation>
            </${type}>
            <dataObject id="myData" />
            <dataObjectReference id="myDataRef" dataObjectRef="myData" />
          </process>
        </definitions>`;
        const moddleContext = await testHelpers.moddleContext(source);
        contextMapper = Serializer(moddleContext, typeResolver);
      });

      it(`${type} delivers the right amount of children`, () => {
        const activity = contextMapper.getActivityById('activity');
        expect(contextMapper.getActivities(activity.id)).to.have.length(3);
        expect(contextMapper.getSequenceFlows(activity.id)).to.have.length(2);
      });

      it(`empty ${type} delivers the right amount of children`, () => {
        const activity = contextMapper.getActivityById('empty-activity');
        expect(contextMapper.getActivities(activity.id)).to.have.length(0);
        expect(contextMapper.getSequenceFlows(activity.id)).to.have.length(0);
      });
    });
  });

  describe('bpmn:Error', () => {
    let serializer;
    before(async () => {
      const moddleContext = await testHelpers.moddleContext(factory.resource('bound-error.bpmn'));
      serializer = Serializer(moddleContext, typeResolver);
    });

    it('getActivityById(errorId) returns error', () => {
      const error = serializer.getActivityById('Error_0');
      expect(error).to.be.ok;

      expect(error).to.have.property('type', 'bpmn:Error');
      expect(error).to.have.property('name', 'InputError');
      expect(error).to.have.property('Behaviour', types.BpmnError);
      expect(error).to.have.property('parent').that.eql({ id: 'Definitions_1', type: 'bpmn:Definitions' });
      expect(error).to.have.property('behaviour').that.include({ errorCode: '404' });
    });

    it('deserialized getActivityById(errorId) returns error', () => {
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      const error = deserialized.getActivityById('Error_0');
      expect(error).to.be.ok;

      expect(error).to.have.property('type', 'bpmn:Error');
      expect(error).to.have.property('name', 'InputError');
      expect(error).to.have.property('Behaviour', types.BpmnError);
      expect(error).to.have.property('parent').that.eql({ id: 'Definitions_1', type: 'bpmn:Definitions' });
      expect(error).to.have.property('behaviour').that.include({ errorCode: '404' });
    });

    it('error reference is stored with activity', () => {
      const activity = serializer.getActivityById('errorEvent');
      expect(activity).to.be.ok;

      expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
      expect(activity.behaviour.eventDefinitions[0]).to.have.property('behaviour').with.property('errorRef').with.property('id', 'Error_0');
    });

    it('deserialized error reference is stored with activity', () => {
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      const activity = deserialized.getActivityById('errorEvent');
      expect(activity).to.be.ok;

      expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
      expect(activity.behaviour.eventDefinitions[0]).to.have.property('behaviour').with.property('errorRef').with.property('id', 'Error_0');
    });
  });

  describe('event definitions', () => {
    describe('bpmn:TimerEventDefinition', () => {
      let contextMapper;
      before(() => {
        contextMapper = Serializer(eventDefinitionModdleContext, typeResolver);
      });

      it('time duration is stored with activity', () => {
        const activity = contextMapper.getActivityById('timerEvent');
        expect(activity).to.be.ok;

        expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
        expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.TimerEventDefinition);
        expect(activity.behaviour.eventDefinitions[0]).to.have.property('behaviour').with.property('timeDuration', 'PT0.05S');
      });

      it('can be deserialized', () => {
        const serialized = contextMapper.serialize();

        const deserialized = deserialize(JSON.parse(serialized), typeResolver);
        const activity = deserialized.getActivityById('timerEvent');

        expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
        expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.TimerEventDefinition);
        expect(activity.behaviour.eventDefinitions[0]).to.have.property('behaviour').with.property('timeDuration', 'PT0.05S');
      });
    });

    describe('bpmn:ConditionalEventDefinition', () => {
      let contextMapper;
      before(() => {
        contextMapper = Serializer(conditionAndEscalationModdleContext, typeResolver);
      });

      it('condition expression is stored with activity', () => {
        const activity = contextMapper.getActivityById('conditionalBoundaryEvent');
        expect(activity).to.be.ok;

        expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
        expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.ConditionalEventDefinition);
        expect(activity.behaviour.eventDefinitions[0])
          .to.have.property('behaviour')
          .with.property('expression', '${environment.variables.conditionMet}');
        expect(activity.behaviour.eventDefinitions[0].behaviour).to.have.property('condition').that.include({
          $type: 'bpmn:FormalExpression',
          body: '${environment.variables.conditionMet}',
        });
      });

      it('can be deserialized', () => {
        const serialized = contextMapper.serialize();

        const deserialized = deserialize(JSON.parse(serialized), typeResolver);
        const activity = deserialized.getActivityById('conditionalBoundaryEvent');

        expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
        expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.ConditionalEventDefinition);
        expect(activity.behaviour.eventDefinitions[0])
          .to.have.property('behaviour')
          .with.property('expression', '${environment.variables.conditionMet}');
        expect(activity.behaviour.eventDefinitions[0].behaviour).to.have.property('condition').that.include({
          $type: 'bpmn:FormalExpression',
          body: '${environment.variables.conditionMet}',
        });
      });
    });

    describe('bpmn:BoundaryEvent', () => {
      let contextMapper;
      before(() => {
        contextMapper = Serializer(eventDefinitionModdleContext, typeResolver);
      });

      it('boundary event has attached to', () => {
        const activity = contextMapper.getActivityById('errorEvent');
        expect(activity).to.be.ok;

        expect(activity.behaviour).to.have.property('attachedTo').that.include({
          id: 'scriptTask',
          type: 'bpmn:ScriptTask',
        });
      });

      it('can be deserialized', () => {
        const serialized = contextMapper.serialize();

        const deserialized = deserialize(JSON.parse(serialized), typeResolver);
        const activity = deserialized.getActivityById('errorEvent');

        expect(activity.behaviour).to.have.property('attachedTo').that.include({
          id: 'scriptTask',
          type: 'bpmn:ScriptTask',
        });
      });
    });

    describe('bpmn:ErrorEventDefinition', () => {
      let contextMapper;
      before(() => {
        contextMapper = Serializer(eventDefinitionModdleContext, typeResolver);
      });

      it('boundary event has event definition with error', () => {
        const activity = contextMapper.getActivityById('errorEvent');
        expect(activity).to.be.ok;

        expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
        expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.ErrorEventDefinition);
        expect(activity.behaviour.eventDefinitions[0]).to.have.property('behaviour').with.property('errorRef');
        expect(activity.behaviour.eventDefinitions[0].behaviour.errorRef).to.include({
          type: 'bpmn:Error',
          id: 'Error_0',
        });
      });

      it('can be deserialized', () => {
        const serialized = contextMapper.serialize();

        const deserialized = deserialize(JSON.parse(serialized), typeResolver);
        const activity = deserialized.getActivityById('errorEvent');

        expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
        expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.ErrorEventDefinition);
        expect(activity.behaviour.eventDefinitions[0]).to.have.property('behaviour').with.property('errorRef');
        expect(activity.behaviour.eventDefinitions[0].behaviour.errorRef).to.include({
          type: 'bpmn:Error',
          id: 'Error_0',
        });
      });
    });

    it('returns id of event definition', () => {
      const contextMapper = Serializer(timersModdleContext, typeResolver);
      const activity = contextMapper.getActivityById('start-cycle');
      const [ed] = activity.behaviour.eventDefinitions;
      expect(ed).to.have.property('id').that.is.ok;
    });
  });

  describe('bpmn:Signal', () => {
    let contextMapper;
    before(() => {
      contextMapper = Serializer(signalEventModdleContext, typeResolver);
    });

    it('Signal is mapped with name and definition as parent', () => {
      const signal = contextMapper.getActivityById('Signal_0');
      expect(signal).to.be.ok;
      expect(signal).to.have.property('name', 'Semaphore');
      expect(signal).to.have.property('parent').that.eql({
        id: 'Definitions_0',
        type: 'bpmn:Definitions',
      });
    });

    it('can be deserialized', () => {
      const serialized = contextMapper.serialize();

      const deserialized = deserialize(JSON.parse(serialized), typeResolver);
      const signal = deserialized.getActivityById('Signal_0');
      expect(signal).to.be.ok;
      expect(signal).to.have.property('name', 'Semaphore');
      expect(signal).to.have.property('parent').that.eql({
        id: 'Definitions_0',
        type: 'bpmn:Definitions',
      });
    });
  });

  describe('bpmn:Association', () => {
    let serializer;
    before(() => {
      serializer = Serializer(compensationContext, typeResolver);
    });

    it('association has target and source ref', () => {
      const association = serializer.getAssociationById('association_0');
      expect(association).to.be.ok;
      expect(association).to.have.property('Behaviour').that.equal(types.Association);
      expect(association).to.have.property('sourceId', 'compensation');
      expect(association).to.have.property('targetId', 'undoService');
      expect(association).to.have.property('parent').that.eql({
        id: 'Process_0',
        type: 'bpmn:Process',
      });
    });

    it('association is deserializable', () => {
      const serialized = serializer.serialize();

      const deserialized = deserialize(JSON.parse(serialized), typeResolver);

      const association = deserialized.getAssociationById('association_0');
      expect(association).to.be.ok;
      expect(association).to.have.property('Behaviour').that.equal(types.Association);
      expect(association).to.have.property('sourceId', 'compensation');
      expect(association).to.have.property('targetId', 'undoService');
      expect(association).to.have.property('parent').that.eql({
        id: 'Process_0',
        type: 'bpmn:Process',
      });
    });

    it('getOutboundAssociations(activityId) returns outbound associations', () => {
      const associations = serializer.getOutboundAssociations('compensation');
      expect(associations).to.have.length(1);
      const association = associations[0];
      expect(association).to.be.ok;
      expect(association).to.have.property('sourceId', 'compensation');
      expect(association).to.have.property('targetId', 'undoService');
      expect(association).to.have.property('parent').that.eql({
        id: 'Process_0',
        type: 'bpmn:Process',
      });
    });

    it('getInboundAssociations(activityId) returns inbound associations', () => {
      const associations = serializer.getInboundAssociations('undoService');
      expect(associations).to.have.length(1);
      const association = associations[0];
      expect(association).to.be.ok;
      expect(association).to.have.property('sourceId', 'compensation');
      expect(association).to.have.property('targetId', 'undoService');
      expect(association).to.have.property('parent').that.eql({
        id: 'Process_0',
        type: 'bpmn:Process',
      });
    });
  });

  describe('bpmn:ReceiveTask', () => {
    let contextMapper;
    before(async () => {
      const source = `
      <?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <process id="theProcess" isExecutable="true">
          <receiveTask id="receive" messageRef="Message1" />
        </process>
        <message id="Message1" name="My message" />
      </definitions>`;
      const moddleContext = await testHelpers.moddleContext(source);
      contextMapper = Serializer(moddleContext, typeResolver);
    });

    it('has reference to message', () => {
      const task = contextMapper.getActivityById('receive');
      expect(task).to.be.ok;
      expect(task).to.have.property('behaviour');
      expect(task.behaviour).to.have.property('messageRef');
      expect(task.behaviour).to.have.property('messageRef').that.eql({ id: 'Message1', name: 'My message', type: 'bpmn:Message' });
      expect(task).to.have.property('Behaviour').that.equal(types.ReceiveTask);
    });

    it('can be deserialized', () => {
      const serialized = contextMapper.serialize();

      const deserialized = deserialize(JSON.parse(serialized), typeResolver);
      const task = deserialized.getActivityById('receive');
      expect(task).to.be.ok;
      expect(task).to.have.property('behaviour');
      expect(task.behaviour).to.have.property('messageRef');
      expect(task.behaviour).to.have.property('messageRef').that.eql({ id: 'Message1', name: 'My message', type: 'bpmn:Message' });
      expect(task).to.have.property('Behaviour').that.equal(types.ReceiveTask);
    });
  });

  describe('bpmn:SendTask', () => {
    let contextMapper;
    before(async () => {
      const source = `
      <?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <process id="theProcess" isExecutable="true">
          <sendTask id="send" implementation="\${environment.services.send}" messageRef="Message1" />
        </process>
        <message id="Message1" name="My message" />
      </definitions>`;
      const moddleContext = await testHelpers.moddleContext(source);
      contextMapper = Serializer(moddleContext, typeResolver);
    });

    it('has implementation and reference to message', () => {
      const task = contextMapper.getActivityById('send');
      expect(task).to.be.ok;
      expect(task).to.have.property('behaviour');
      expect(task.behaviour).to.have.property('Service', types.ServiceImplementation);
      expect(task.behaviour).to.have.property('messageRef');
      expect(task.behaviour).to.have.property('messageRef').that.eql({ id: 'Message1', name: 'My message', type: 'bpmn:Message' });
      expect(task).to.have.property('Behaviour').that.equal(types.SendTask);
    });

    it('can be deserialized', () => {
      const serialized = contextMapper.serialize();

      const deserialized = deserialize(JSON.parse(serialized), typeResolver);
      const task = deserialized.getActivityById('send');
      expect(task).to.be.ok;
      expect(task).to.have.property('behaviour');
      expect(task.behaviour).to.have.property('Service', types.ServiceImplementation);
      expect(task.behaviour).to.have.property('messageRef');
      expect(task.behaviour).to.have.property('messageRef').that.eql({ id: 'Message1', name: 'My message', type: 'bpmn:Message' });
      expect(task).to.have.property('Behaviour').that.equal(types.SendTask);
    });
  });

  describe('escalation', () => {
    let contextMapper;
    before(() => {
      contextMapper = Serializer(conditionAndEscalationModdleContext, typeResolver);
    });

    it('escalation event definition is stored with activity', () => {
      const activity = contextMapper.getActivityById('end');
      expect(activity).to.be.ok;

      expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
      expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.EscalationEventDefinition);
      expect(activity.behaviour.eventDefinitions[0].behaviour).to.have.property('escalationRef').with.property('id', 'Escalation_0');
    });

    it('can be deserialized', () => {
      const serialized = contextMapper.serialize();

      const deserialized = deserialize(JSON.parse(serialized), typeResolver);
      const activity = deserialized.getActivityById('end');
      expect(activity).to.be.ok;

      expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
      expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.EscalationEventDefinition);
      expect(activity.behaviour.eventDefinitions[0].behaviour).to.have.property('escalationRef').with.property('id', 'Escalation_0');
    });

    it('escalation element has escalation name and code', () => {
      const serialized = contextMapper.serialize();

      const deserialized = deserialize(JSON.parse(serialized), typeResolver);
      const escalation = deserialized.getActivityById('Escalation_0');
      expect(escalation).to.be.ok;

      expect(escalation.behaviour).to.have.property('name', 'Escalate');
      expect(escalation.behaviour).to.have.property('escalationCode', '404');
    });

    it('escalation sub process element has triggered by event property', () => {
      const serialized = contextMapper.serialize();

      const deserialized = deserialize(JSON.parse(serialized), typeResolver);
      const activity = deserialized.getActivityById('escalationSubProcess');
      expect(activity).to.be.ok;
      expect(activity.behaviour).to.have.property('triggeredByEvent', true);
    });

    it('escalation start element has non-interupting property, escalation name and code', () => {
      const serialized = contextMapper.serialize();

      const deserialized = deserialize(JSON.parse(serialized), typeResolver);
      const activity = deserialized.getActivityById('startEscalation');
      expect(activity).to.be.ok;

      expect(activity.behaviour).to.have.property('isInterrupting', false);
      expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
      expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.EscalationEventDefinition);
      expect(activity.behaviour.eventDefinitions[0].behaviour).to.have.property('escalationRef').with.property('id', 'Escalation_0');
    });
  });

  describe('signal event', () => {
    let contextMapper;
    before(() => {
      contextMapper = Serializer(signalEventModdleContext, typeResolver);
    });

    it('signal event definition is stored with activity', () => {
      const activity = contextMapper.getActivityById('signal');
      expect(activity).to.be.ok;

      expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
      expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.SignalEventDefinition);
      expect(activity.behaviour.eventDefinitions[0].behaviour).to.have.property('signalRef').with.property('id', 'Signal_0');
    });

    it('can be deserialized', () => {
      const serialized = contextMapper.serialize();

      const deserialized = deserialize(JSON.parse(serialized), typeResolver);
      const activity = deserialized.getActivityById('signal');
      expect(activity).to.be.ok;

      expect(activity.behaviour).to.have.property('eventDefinitions').with.length(1);
      expect(activity.behaviour.eventDefinitions[0]).to.have.property('Behaviour', types.SignalEventDefinition);
      expect(activity.behaviour.eventDefinitions[0].behaviour).to.have.property('signalRef').with.property('id', 'Signal_0');
    });

    it('signal element has escalation name and code', () => {
      const serialized = contextMapper.serialize();

      const deserialized = deserialize(JSON.parse(serialized), typeResolver);
      const escalation = deserialized.getActivityById('Signal_0');
      expect(escalation).to.be.ok;

      expect(escalation.behaviour).to.have.property('name', 'Semaphore');
    });
  });

  describe('bpmn:property', () => {
    it('activity with bpmn:Property returns reference to dataObject by reference', async () => {
      const moddleContext = await testHelpers.moddleContext(factory.resource('engine-issue-139.bpmn'));
      const serialized = Serializer(moddleContext, typeResolver);

      const activity = serialized.getActivityById('Activity_0ksziuo');
      const properties = activity.behaviour.properties;

      expect(properties).to.be.an('object').with.property('values').with.length(1);
      expect(properties).to.have.property('Behaviour', types.Properties);
      expect(properties.values[0]).to.have.property('id');
      expect(properties.values[0]).to.have.property('type');
      expect(properties.values[0].behaviour).to.have.property('dataInput').with.property('association').with.property('source');
      expect(properties.values[0].behaviour.dataInput.association.source).to.have.property('dataObject').with.property('id');
      expect(properties.values[0].behaviour.dataInput.association.source, 'no dataStore').to.not.have.property('dataStore');
      expect(properties.values[0].behaviour).to.not.have.property('dataOutput');
    });

    it('activity with bpmn:Property returns reference to dataObject directly', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        id="io-def" targetNamespace="http://activiti.org/bpmn">
        <process id="Process_1" isExecutable="true">
           <startEvent id="start" />
           <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
           <task id="task">
              <property id="prop_1" />
              <dataInputAssociation id="association_1">
                 <sourceRef>DataObject_1</sourceRef>
                 <targetRef>prop_1</targetRef>
              </dataInputAssociation>
              <dataOutputAssociation id="association_2">
                 <sourceRef>prop_1</sourceRef>
                 <targetRef>DataObject_2</targetRef>
              </dataOutputAssociation>
           </task>
           <dataObject id="DataObject_1" />
           <dataObject id="DataObject_2" />
         </process>
       </definitions>
      `;

      const moddleContext = await testHelpers.moddleContext(source);
      expect(moddleContext.warnings).to.be.empty;

      const serialized = Serializer(moddleContext, typeResolver);

      const activity = serialized.getActivityById('task');
      const properties = activity.behaviour.properties;

      expect(properties).to.be.an('object').with.property('values').with.length(1);
      expect(properties).to.have.property('Behaviour', types.Properties);
      expect(properties.values[0]).to.have.property('id');
      expect(properties.values[0]).to.have.property('type');

      expect(properties.values[0].behaviour).to.have.property('dataInput').with.property('association').with.property('source');

      expect(properties.values[0].behaviour.dataInput.association.source)
        .to.have.property('dataObject')
        .with.property('id', 'DataObject_1');
      expect(properties.values[0].behaviour.dataInput.association.source, 'no dataStore').to.not.have.property('dataStore');

      expect(properties.values[0].behaviour).to.have.property('dataOutput');
      expect(properties.values[0].behaviour.dataOutput.association.target)
        .to.have.property('dataObject')
        .with.property('id', 'DataObject_2');
      expect(properties.values[0].behaviour.dataOutput.association.target, 'no dataStore').to.not.have.property('dataStore');
    });
  });

  describe('bpmn:dataStoreReference', () => {
    it('activity with bpmn:Property associated with dataStoreReference', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        id="Definitions_1ke2tm6"
        targetNamespace="http://bpmn.io/schema/bpmn">
        <process id="Process_15ozyjy" isExecutable="true">
          <startEvent id="start" />
          <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
          <task id="task">
            <property id="ds-prop" name="__targetRef_placeholder" />
            <dataInputAssociation id="DataInputAssociation_1">
              <sourceRef>DataStoreReference_1</sourceRef>
              <targetRef>ds-prop</targetRef>
            </dataInputAssociation>
          </task>
          <dataStoreReference id="DataStoreReference_1" />
        </process>
      </definitions>`;

      const moddleContext = await testHelpers.moddleContext(source);
      expect(moddleContext.warnings).to.be.empty;

      const serialized = Serializer(moddleContext, typeResolver);

      const activity = serialized.getActivityById('task');
      const properties = activity.behaviour.properties;

      expect(properties).to.be.an('object').with.property('values').with.length(1);
      expect(properties).to.have.property('Behaviour', types.Properties);
      expect(properties.values[0]).to.have.property('id');
      expect(properties.values[0]).to.have.property('type');
      expect(properties.values[0].behaviour, 'dataInput association')
        .to.have.property('dataInput')
        .with.property('association')
        .with.property('source');
      expect(properties.values[0].behaviour.dataInput.association.source, 'dataStoreReference')
        .to.have.property('dataStore')
        .with.property('id', 'DataStoreReference_1');
    });

    it('activity with bpmn:Property associated with dataStoreReference and dataStore', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        id="Definitions_1ke2tm6"
        targetNamespace="http://bpmn.io/schema/bpmn">
        <process id="Process_15ozyjy" isExecutable="true">
          <startEvent id="start" />
          <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
          <task id="task">
            <property id="ds-prop" name="__targetRef_placeholder" />
            <dataInputAssociation id="DataInputAssociation_1">
              <sourceRef>DataStoreReference_1</sourceRef>
              <targetRef>ds-prop</targetRef>
            </dataInputAssociation>
          </task>
          <dataStoreReference id="DataStoreReference_1" dataStoreRef="datastore" />
        </process>
        <dataStore id="datastore" isUnlimited="false" capacity="100" />
      </definitions>`;

      const moddleContext = await testHelpers.moddleContext(source);
      expect(moddleContext.warnings, moddleContext.warnings).to.be.empty;

      const serialized = Serializer(moddleContext, typeResolver);

      const activity = serialized.getActivityById('task');
      const properties = activity.behaviour.properties;

      expect(properties).to.be.an('object').with.property('values').with.length(1);
      expect(properties).to.have.property('Behaviour', types.Properties);
      expect(properties.values[0]).to.have.property('id');
      expect(properties.values[0]).to.have.property('type');
      expect(properties.values[0].behaviour, 'dataInput association')
        .to.have.property('dataInput')
        .with.property('association')
        .with.property('source');
      const inputSource = properties.values[0].behaviour.dataInput.association.source;
      expect(inputSource, 'dataStore').to.have.property('dataStore').with.property('id', 'datastore');
      expect(inputSource.dataStore).to.have.property('isUnlimited', false);
      expect(inputSource.dataStore).to.have.property('capacity', 100);
      expect(inputSource, 'no dataObject').to.not.have.property('dataObject');
    });

    it('activity with bpmn:Property associated with dataStore', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        id="Definitions_1ke2tm6"
        targetNamespace="http://bpmn.io/schema/bpmn">
        <process id="Process_15ozyjy" isExecutable="true">
          <startEvent id="start" />
          <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
          <task id="task">
            <property id="ds-prop" name="__targetRef_placeholder" />
            <dataInputAssociation id="DataInputAssociation_1">
              <sourceRef>datastore</sourceRef>
              <targetRef>ds-prop</targetRef>
            </dataInputAssociation>
          </task>
        </process>
        <dataStore id="datastore" isUnlimited="false" capacity="100" />
      </definitions>`;

      const moddleContext = await testHelpers.moddleContext(source);
      expect(moddleContext.warnings, moddleContext.warnings).to.be.empty;

      const serialized = Serializer(moddleContext, typeResolver);

      const activity = serialized.getActivityById('task');
      const properties = activity.behaviour.properties;

      expect(properties).to.be.an('object').with.property('values').with.length(1);
      expect(properties).to.have.property('Behaviour', types.Properties);
      expect(properties.values[0]).to.have.property('id');
      expect(properties.values[0]).to.have.property('type');
      expect(properties.values[0].behaviour, 'dataInput association')
        .to.have.property('dataInput')
        .with.property('association')
        .with.property('source');
      const inputSource = properties.values[0].behaviour.dataInput.association.source;
      expect(inputSource, 'dataStore').to.have.property('dataStore').with.property('id', 'datastore');
      expect(inputSource.dataStore).to.have.property('isUnlimited', false);
      expect(inputSource.dataStore).to.have.property('capacity', 100);
      expect(inputSource, 'no dataObject').to.not.have.property('dataObject');
    });

    it('activity with bpmn:Property output returns reference to dataStoreReference', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        id="Definitions_1ke2tm6"
        targetNamespace="http://bpmn.io/schema/bpmn">
        <process id="Process_15ozyjy" isExecutable="true">
          <startEvent id="start" />
          <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
          <task id="task">
            <property id="ds-prop" name="__targetRef_placeholder" />
            <dataOutputAssociation id="DataInputAssociation_1">
              <sourceRef>ds-prop</sourceRef>
              <targetRef>DataStoreReference_1</targetRef>
            </dataOutputAssociation>
          </task>
          <dataStoreReference id="DataStoreReference_1" />
        </process>
       </definitions>
      `;
      const moddleContext = await testHelpers.moddleContext(source);
      expect(moddleContext.warnings).to.be.empty;

      const serialized = Serializer(moddleContext, typeResolver);

      const activity = serialized.getActivityById('task');
      const properties = activity.behaviour.properties;

      expect(properties).to.be.an('object').with.property('values').with.length(1);
      expect(properties).to.have.property('Behaviour', types.Properties);
      expect(properties.values[0]).to.have.property('id');
      expect(properties.values[0]).to.have.property('type');
      expect(properties.values[0].behaviour, 'dataOutput association')
        .to.have.property('dataOutput')
        .with.property('association')
        .with.property('source');
      expect(properties.values[0].behaviour.dataOutput.association.target, 'dataStoreReference')
        .to.have.property('dataStore')
        .with.property('id', 'DataStoreReference_1');
    });

    it('activity with bpmn:InputOutputSpecification returns reference to dataStoreReference', async () => {
      const source = `
      <?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <process id="theProcess" isExecutable="true">
          <task id="task">
            <ioSpecification id="inputSpec">
              <dataInput id="userInput" name="info" />
              <dataOutput id="userOutput" name="result" />
            </ioSpecification>
            <dataInputAssociation id="associatedWith" sourceRef="DataStoreReference_1" targetRef="userInput" />
            <dataOutputAssociation id="associatedWithOut" sourceRef="userOutput" targetRef="DataStoreReference_1" />
          </task>
          <dataStoreReference id="DataStoreReference_1" />
        </process>
      </definitions>`;

      const moddleContext = await testHelpers.moddleContext(source);
      expect(moddleContext.warnings).to.be.empty;

      const serialized = Serializer(moddleContext, typeResolver);

      const activity = serialized.getActivityById('task');
      const ioSpecification = activity.behaviour.ioSpecification;

      expect(ioSpecification.behaviour).to.be.an('object').with.property('dataInputs').with.length(1);
      expect(ioSpecification.behaviour.dataInputs[0].behaviour.association.source.dataStore).to.deep.equal({
        $type: 'bpmn:DataStoreReference',
        id: 'DataStoreReference_1',
      });

      expect(ioSpecification.behaviour).to.be.an('object').with.property('dataOutputs').with.length(1);
      expect(ioSpecification.behaviour.dataOutputs[0].behaviour.association.target.dataStore).to.deep.equal({
        $type: 'bpmn:DataStoreReference',
        id: 'DataStoreReference_1',
      });
    });

    it('deserializes dataStores', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        id="Definitions_1"
        targetNamespace="http://bpmn.io/schema/bpmn">
        <process id="Process_15ozyjy" isExecutable="true">
          <startEvent id="start" />
          <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
          <task id="task">
            <property id="dsr-prop" name="__targetRef_placeholder" />
            <dataInputAssociation id="DataInputAssociation_1">
              <sourceRef>DataStoreReference_1</sourceRef>
              <targetRef>ds-prop</targetRef>
            </dataInputAssociation>
            <property id="ds-prop" name="__targetRef_placeholder" />
            <dataInputAssociation id="DataInputAssociation_2">
              <sourceRef>DataStoreReference_2</sourceRef>
              <targetRef>ds-prop</targetRef>
            </dataInputAssociation>
          </task>
          <dataStoreReference id="DataStoreReference_1" />
          <dataStoreReference id="DataStoreReference_2" dataStoreRef="datastore" />
        </process>
        <dataStore id="datastore" isUnlimited="false" capacity="100" />
      </definitions>`;

      const moddleContext = await testHelpers.moddleContext(source);

      const serializer = Serializer(moddleContext, typeResolver);
      let serialized = serializer.serialize();

      const parsed = JSON.parse(serialized);

      expect(parsed).to.have.property('dataStores').with.length(3);
      expect(parsed.dataStores[0]).to.have.property('id', 'DataStoreReference_1');
      expect(parsed.dataStores[1]).to.have.property('id', 'DataStoreReference_2');
      expect(parsed.dataStores[2]).to.have.property('id', 'datastore');

      let deserialized = deserialize(JSON.parse(serialized), typeResolver);
      expect(deserialized.getDataStoreReferences()).to.have.length(3);
      expect(deserialized.getDataStores())
        .to.have.length(1)
        .and.deep.equal([
          {
            id: 'datastore',
            type: 'bpmn:DataStore',
            Behaviour: types.DataStore,
            behaviour: {
              $type: 'bpmn:DataStore',
              capacity: 100,
              id: 'datastore',
              isUnlimited: false,
            },
            parent: {
              id: 'Definitions_1',
              type: 'bpmn:Definitions',
            },
            references: [
              {
                behaviour: {
                  $type: 'bpmn:DataStoreReference',
                  id: 'DataStoreReference_2',
                },
                id: 'DataStoreReference_2',
                type: 'bpmn:DataStoreReference',
              },
            ],
          },
        ]);
      expect(deserialized.getDataStoreById('datastore')).to.have.property('id', 'datastore');

      serialized = deserialized.serialize();

      expect(JSON.parse(serialized)).to.have.property('dataStores').with.length(3);

      deserialized = deserialize(JSON.parse(serialized), typeResolver);

      const dataStores = deserialized.getDataStoreReferences();

      expect(dataStores).to.have.property('length', 3);
      expect(dataStores[0]).to.have.property('id', 'DataStoreReference_1');
      expect(dataStores[0]).to.have.property('Behaviour', types.DataStoreReference);
      expect(dataStores[1]).to.have.property('id', 'DataStoreReference_2');
      expect(dataStores[1]).to.have.property('Behaviour', types.DataStoreReference);
      expect(dataStores[2]).to.have.property('id', 'datastore');
      expect(dataStores[2]).to.have.property('Behaviour', types.DataStore);
    });

    it('getDataStoreReferences() returns all dataStoreReferences', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        id="Definitions_1ke2tm6"
        targetNamespace="http://bpmn.io/schema/bpmn">
        <process id="Process_1" isExecutable="true">
          <startEvent id="start" />
          <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
          <subProcess id="task">
            <property id="ds-prop" name="__targetRef_placeholder" />
            <dataInputAssociation id="DataInputAssociation_1">
              <sourceRef>DataStoreReference_1</sourceRef>
              <targetRef>ds-prop</targetRef>
            </dataInputAssociation>
            <dataStoreReference id="DataStoreReference_2" />
            <dataStoreReference id="DataStoreReference_3" />
          </subProcess>
          <dataStoreReference id="DataStoreReference_1" />
        </process>
       </definitions>
      `;
      const moddleContext = await testHelpers.moddleContext(source);
      expect(moddleContext.warnings).to.be.empty;

      const serializer = Serializer(moddleContext, typeResolver);

      const elements = serializer.getDataStoreReferences();
      expect(elements).to.have.length(3);

      elements.forEach((elm) => {
        expect(elm).to.have.property('id').that.is.ok;
        expect(elm).to.have.property('parent').that.is.ok;
        expect(elm.parent).to.have.property('id').that.is.ok;
        expect(elm.parent).to.have.property('type').that.is.ok;
      });
    });

    it('getDataStoreReferences(scopeId) returns dataStoreReferences within scope', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        id="Definitions_1ke2tm6"
        targetNamespace="http://bpmn.io/schema/bpmn">
        <process id="Process_1" isExecutable="true">
          <startEvent id="start" />
          <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
          <subProcess id="task">
            <property id="ds-prop" name="__targetRef_placeholder" />
            <dataInputAssociation id="DataInputAssociation_1">
              <sourceRef>DataStoreReference_1</sourceRef>
              <targetRef>ds-prop</targetRef>
            </dataInputAssociation>
            <dataStoreReference id="DataStoreReference_2" />
            <dataStoreReference id="DataStoreReference_3" />
          </subProcess>
          <dataStoreReference id="DataStoreReference_1" />
        </process>
       </definitions>`;
      const moddleContext = await testHelpers.moddleContext(source);
      expect(moddleContext.warnings).to.be.empty;

      const serializer = Serializer(moddleContext, typeResolver);

      const elements = serializer.getDataStoreReferences('task');
      expect(elements).to.have.length(2);

      elements.forEach((elm) => {
        expect(elm).to.have.property('id').that.is.ok;
        expect(elm).to.have.property('parent').that.is.ok;
        expect(elm.parent).to.have.property('id').to.equal('task');
        expect(elm.parent).to.have.property('type', 'bpmn:SubProcess');
      });
    });

    it('getDataStoreReferenceById(referenceId) returns dataStoreReference or undefined', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        id="Definitions_1ke2tm6"
        targetNamespace="http://bpmn.io/schema/bpmn">
        <process id="Process_1" isExecutable="true">
          <startEvent id="start" />
          <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
          <task id="task">
            <property id="ds-prop" name="__targetRef_placeholder" />
            <dataInputAssociation id="DataInputAssociation_1">
              <sourceRef>DataStoreReference_1</sourceRef>
              <targetRef>ds-prop</targetRef>
            </dataInputAssociation>
          </task>
          <dataStoreReference id="DataStoreReference_1" />
        </process>
       </definitions>
      `;
      const moddleContext = await testHelpers.moddleContext(source);

      const serializer = Serializer(moddleContext, typeResolver);
      expect(serializer.getDataStoreReferenceById('DataStoreReference_2')).to.be.undefined;

      const dataStore = serializer.getDataStoreReferenceById('DataStoreReference_1');
      expect(dataStore).to.have.property('id', 'DataStoreReference_1');
      expect(dataStore).to.have.property('parent').that.deep.equal({
        id: 'Process_1',
        type: 'bpmn:Process',
      });
      expect(dataStore).to.have.property('Behaviour', types.DataStoreReference);
    });

    it('getDataStoreById(storeId) returns dataStore or undefined', async () => {
      const source = `<?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        id="Definitions_1"
        targetNamespace="http://bpmn.io/schema/bpmn">
        <process id="Process_1" isExecutable="true">
          <startEvent id="start" />
          <sequenceFlow id="to-task" sourceRef="start" targetRef="task" />
          <task id="task">
            <property id="ds-prop" name="__targetRef_placeholder" />
            <dataInputAssociation id="DataInputAssociation_1">
              <sourceRef>DataStoreReference_1</sourceRef>
              <targetRef>ds-prop</targetRef>
            </dataInputAssociation>
          </task>
          <dataStoreReference id="DataStoreReference_1" dataStoreRef="datastore" />
        </process>
        <dataStore id="datastore" name="My data" isUnlimited="false" capacity="100" />
       </definitions>
      `;
      const moddleContext = await testHelpers.moddleContext(source);

      const serializer = Serializer(moddleContext, typeResolver);
      expect(serializer.getDataStoreReferenceById('DataStoreReference_2')).to.be.undefined;

      expect(serializer.getDataStores())
        .to.have.length(1)
        .and.deep.equal([
          {
            id: 'datastore',
            type: 'bpmn:DataStore',
            name: 'My data',
            Behaviour: types.DataStore,
            behaviour: {
              $type: 'bpmn:DataStore',
              name: 'My data',
              capacity: 100,
              id: 'datastore',
              isUnlimited: false,
            },
            parent: {
              id: 'Definitions_1',
              type: 'bpmn:Definitions',
            },
            references: [
              {
                behaviour: {
                  $type: 'bpmn:DataStoreReference',
                  id: 'DataStoreReference_1',
                },
                id: 'DataStoreReference_1',
                type: 'bpmn:DataStoreReference',
              },
            ],
          },
        ]);

      expect(serializer.getDataStoreById('datastore')).to.have.property('id', 'datastore');
      expect(serializer.getDataStoreById('DataStoreReference_1')).to.be.undefined;
    });
  });

  describe('humans', () => {
    it('human performer and potential owner is returned in behaviour', async () => {
      const source = `
      <?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <process id="theProcess" isExecutable="true">
          <userTask id="task">
            <humanPerformer>
              <resourceAssignmentExpression>
                <formalExpression>pal</formalExpression>
              </resourceAssignmentExpression>
            </humanPerformer>
            <potentialOwner>
              <resourceAssignmentExpression>
                <formalExpression>user(pal), group(users)</formalExpression>
              </resourceAssignmentExpression>
            </potentialOwner>
          </userTask>
        </process>
      </definitions>`;

      const context = Serializer(await testHelpers.moddleContext(source), typeResolver);
      const task = context.getActivityById('task');

      expect(task.behaviour).to.have.property('resources').that.has.length(2);

      expect(task.behaviour.resources[0]).to.have.property('type', 'bpmn:HumanPerformer');
      expect(task.behaviour.resources[0]).to.have.property('expression', 'pal');
      expect(task.behaviour.resources[0]).to.have.property('behaviour').with.property('$type');
      expect(task.behaviour.resources[1]).to.have.property('type', 'bpmn:PotentialOwner');
      expect(task.behaviour.resources[1]).to.have.property('expression', 'user(pal), group(users)');
      expect(task.behaviour.resources[1]).to.have.property('behaviour').with.property('$type');
    });

    it('human performer and potential owner without expression is still returned in behaviour', async () => {
      const source = `
      <?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <process id="theProcess" isExecutable="true">
          <userTask id="task">
            <humanPerformer>
              <resourceAssignmentExpression>
              </resourceAssignmentExpression>
            </humanPerformer>
            <potentialOwner>
              <resourceAssignmentExpression>
              </resourceAssignmentExpression>
            </potentialOwner>
          </userTask>
        </process>
      </definitions>`;

      const context = Serializer(await testHelpers.moddleContext(source), typeResolver);
      const task = context.getActivityById('task');

      expect(task.behaviour).to.have.property('resources').that.has.length(2);

      expect(task.behaviour.resources[0]).to.have.property('type', 'bpmn:HumanPerformer');
      expect(task.behaviour.resources[0].expression).to.be.undefined;
      expect(task.behaviour.resources[0]).to.have.property('behaviour').with.property('$type');
      expect(task.behaviour.resources[1]).to.have.property('type', 'bpmn:PotentialOwner');
      expect(task.behaviour.resources[1].expression).to.be.undefined;
      expect(task.behaviour.resources[1]).to.have.property('behaviour').with.property('$type');
    });

    it('extended assignee is returned in behaviour', async () => {
      const source = `
      <?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:camunda="http://camunda.org/schema/1.0/bpmn">
        <process id="theProcess" isExecutable="true">
          <userTask id="task" camunda:assignee="pal" />
        </process>
      </definitions>`;

      const moddleOptions = { camunda: testHelpers.getCamundaExtension() };
      const context = Serializer(await testHelpers.moddleContext(source, moddleOptions), typeResolver);
      const task = context.getActivityById('task');
      expect(task.behaviour).to.have.property('assignee', 'pal');
    });
  });

  describe('bpmn:MessageFlow', () => {
    let serializer;
    before(() => {
      serializer = Serializer(messageFlowModdleContext, typeResolver);
    });

    it('can target lane', () => {
      const [toLaneFlow] = serializer.getMessageFlows();
      expect(toLaneFlow).to.be.ok;
      expect(toLaneFlow).to.have.property('target').with.property('processId', 'participantProcess');
      expect(toLaneFlow.target).to.not.have.property('id');
    });

    it('can target activity', () => {
      const [, toActivityFlow] = serializer.getMessageFlows();
      expect(toActivityFlow).to.be.ok;
      expect(toActivityFlow).to.have.property('target').with.property('processId', 'mainProcess');
      expect(toActivityFlow.target).to.have.property('id', 'intermediate');
    });
  });

  describe('bpmn:Collaboration', () => {
    let serializer;
    before(async () => {
      const source = `
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <collaboration id="Collaboration_0">
          <participant id="lane1" name="Main" processRef="mainProcess" />
          <participant id="part2" name="Participant" processRef="participantProcess" />
          <messageFlow id="mflow1" sourceRef="lane1" targetRef="part2" />
        </collaboration>
        <collaboration id="Collaboration_1" name="Among peers">
          <participant id="part3" name="Peer 1" processRef="mainProcess" />
          <participant id="part4" name="Peer 2" processRef="participantProcess" />
          <messageFlow id="mflow2" sourceRef="part4" targetRef="part3" />
        </collaboration>
        <process id="mainProcess" isExecutable="true">
          <startEvent id="start1" />
        </process>
        <process id="participantProcess" />
      </definitions>`;
      const moddleContext = await testHelpers.moddleContext(source);
      serializer = Serializer(moddleContext, typeResolver);
    });

    it('participants are stored in elements', () => {
      expect(serializer.elements.participants).to.deep.equal([
        {
          id: 'lane1',
          type: 'bpmn:Participant',
          name: 'Main',
          processId: 'mainProcess',
          parent: {
            id: 'Collaboration_0',
            type: 'bpmn:Collaboration',
          },
        },
        {
          id: 'part2',
          type: 'bpmn:Participant',
          name: 'Participant',
          processId: 'participantProcess',
          parent: {
            id: 'Collaboration_0',
            type: 'bpmn:Collaboration',
          },
        },
        {
          id: 'part3',
          type: 'bpmn:Participant',
          name: 'Peer 1',
          processId: 'mainProcess',
          parent: {
            id: 'Collaboration_1',
            type: 'bpmn:Collaboration',
          },
        },
        {
          id: 'part4',
          type: 'bpmn:Participant',
          name: 'Peer 2',
          processId: 'participantProcess',
          parent: {
            id: 'Collaboration_1',
            type: 'bpmn:Collaboration',
          },
        },
      ]);
    });

    it('participants are deserialized', () => {
      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);
      expect(deserialized.elements.participants).to.have.length(4);
      for (const p of deserialized.elements.participants) {
        expect(p).to.have.property('id');
        expect(p).to.have.property('parent').with.property('id');
      }
    });

    it('collaboration message flows get participant information', () => {
      const [mflow1, mflow2] = serializer.getMessageFlows();

      expect(mflow1).to.have.property('source').that.deep.equal({
        participantId: 'lane1',
        participantName: 'Main',
        processId: 'mainProcess',
      });
      expect(mflow1).to.have.property('target').that.deep.equal({
        participantId: 'part2',
        participantName: 'Participant',
        processId: 'participantProcess',
      });
      expect(mflow2).to.have.property('source').that.deep.equal({
        participantId: 'part4',
        participantName: 'Peer 2',
        processId: 'participantProcess',
      });
      expect(mflow2).to.have.property('target').that.deep.equal({
        participantId: 'part3',
        participantName: 'Peer 1',
        processId: 'mainProcess',
      });
    });
  });
});

describe('type resolver', () => {
  it('throws if type is not found', () => {
    const resolver = TypeResolver({});
    expect(() => {
      resolver({ type: 'bpmn:Unknown' });
    }).to.throw(/Unknown activity/i);
  });
});

function assertEntity(activity) {
  const { type, behaviour } = activity;

  expect(activity, type).to.have.property('id').that.is.ok;
  expect(activity, type).to.have.property('type').that.is.ok;
  expect(activity, `${type}.Behaviour`).to.have.property('Behaviour').that.is.a('function');
  expect(activity, type).to.have.property('parent').that.is.ok.and.an('object');
  expect(activity.parent, `${type}.parent`).to.have.property('id').that.is.ok;
  expect(activity.parent, `${type}.parent`).to.have.property('type').that.is.ok;

  expect(activity).to.have.property('behaviour').that.is.ok;
  if (behaviour.loopCharacteristics) {
    expect(behaviour.loopCharacteristics, `${type}.loopCharacteristics`).to.have.property(
      'Behaviour',
      types.MultiInstanceLoopCharacteristics,
    );
  }
  if (behaviour.ioSpecification) {
    expect(behaviour.ioSpecification, `${type}.ioSpecification`).to.have.property('Behaviour', types.InputOutputSpecification);
  }
  if (behaviour.eventDefinitions) {
    behaviour.eventDefinitions.forEach((def) => {
      expect(def, `${type}.eventDefinitions.${def.type}`).to.have.property('Behaviour').that.is.a('function');
    });
  }
  if (behaviour.eventDefinitions) {
    behaviour.eventDefinitions.forEach((def) => {
      expect(def, `${type}.eventDefinitions.${def.type}`).to.have.property('Behaviour').that.is.a('function');
    });
  }
}

function assertSequenceFlow(flow) {
  expect(flow).to.have.property('id').that.is.ok;
  expect(flow).to.have.property('type').that.is.ok;
  expect(flow).to.have.property('Behaviour', types.SequenceFlow);
  expect(flow).to.have.property('sourceId').that.is.ok;
  expect(flow).to.have.property('targetId').that.is.ok;
  expect(flow).to.have.property('parent').that.is.ok.and.an('object');
  expect(flow.parent).to.have.property('id').that.is.ok;
  expect(flow.parent).to.have.property('type', 'bpmn:Process');
}
