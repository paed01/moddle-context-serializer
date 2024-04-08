import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';

import { default as Serializer, TypeResolver, deserialize } from '../index.js';

const typeResolver = TypeResolver(types);

describe('message flow', () => {
  it('message flow emanates from participant', async () => {
    const source = `
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <collaboration id="Collaboration_0" name="Collaborate">
        <messageFlow id="fromMainToParticipant" sourceRef="part1" targetRef="part2" />
        <participant id="part1" name="Main" processRef="mainProcess" />
        <participant id="part2" name="Participant" processRef="participantProcess" />
      </collaboration>
      <process id="mainProcess" isExecutable="true">
        <startEvent id="start1" />
        <sequenceFlow id="toTask" sourceRef="start1" targetRef="send" />
        <endEvent id="send">
          <messageEventDefinition messageRef="Message1" />
        </endEvent>
      </process>
      <process id="participantProcess">
        <startEvent id="start2">
          <messageEventDefinition messageRef="Message1" />
        </startEvent>
        <sequenceFlow id="toEnd" sourceRef="start2" targetRef="end" />
        <endEvent id="end" />
      </process>
      <message id="Message1" name="Start message" />
    </definitions>`;

    const moddleContext = await testHelpers.moddleContext(source);
    const serializer = Serializer(moddleContext, typeResolver);

    const [flow] = serializer.getMessageFlows();

    expect(flow.source, 'source').to.deep.equal({
      processId: 'mainProcess',
      participantId: 'part1',
      participantName: 'Main',
    });
    expect(flow.target, 'target').to.deep.equal({
      processId: 'participantProcess',
      participantId: 'part2',
      participantName: 'Participant',
    });

    const state = serializer.serialize();
    const deserialized = deserialize(JSON.parse(state), typeResolver);

    const [deserializedFlow] = deserialized.getMessageFlows();

    expect(deserializedFlow.source, 'source').to.deep.equal({
      processId: 'mainProcess',
      participantId: 'part1',
      participantName: 'Main',
    });
    expect(deserializedFlow.target, 'target').to.deep.equal({
      processId: 'participantProcess',
      participantId: 'part2',
      participantName: 'Participant',
    });
  });

  it('message flow emanates from process', async () => {
    const source = `
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <collaboration id="Collaboration_0">
        <messageFlow id="fromMainToParticipant" sourceRef="mainProcess" targetRef="part2" />
        <participant id="part1" name="Main" processRef="mainProcess" />
        <participant id="part2" name="Participant" processRef="participantProcess" />
      </collaboration>
      <process id="mainProcess" isExecutable="true">
        <startEvent id="start1" />
        <sequenceFlow id="toTask" sourceRef="start1" targetRef="send" />
        <endEvent id="send">
          <messageEventDefinition messageRef="Message1" />
        </endEvent>
      </process>
      <process id="participantProcess">
        <startEvent id="start2">
          <messageEventDefinition messageRef="Message1" />
        </startEvent>
        <sequenceFlow id="toEnd" sourceRef="start2" targetRef="end" />
        <endEvent id="end" />
      </process>
      <message id="Message1" name="Start message" />
    </definitions>`;

    const moddleContext = await testHelpers.moddleContext(source);
    const serializer = Serializer(moddleContext, typeResolver);

    const [flow] = serializer.getMessageFlows();

    expect(flow.source, 'source').to.deep.equal({
      processId: 'mainProcess',
    });
    expect(flow.target, 'target').to.deep.equal({
      processId: 'participantProcess',
      participantId: 'part2',
      participantName: 'Participant',
    });
  });
});
