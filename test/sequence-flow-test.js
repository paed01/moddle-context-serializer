import factory from './helpers/factory.js';
import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';

import {default as Serializer, TypeResolver, deserialize} from '../src/index.js';

const typeResolver = TypeResolver(types);

describe('sequence flow', () => {
  it('sequence flow with custom resource condition', async () => {
    const source = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions id="testProcess" xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess1" isExecutable="true">
        <startEvent id="theStart" />
        <inclusiveGateway id="decision" default="flow2" />
        <endEvent id="end1" />
        <endEvent id="end2" />
        <sequenceFlow id="flow1" sourceRef="theStart" targetRef="decision" />
        <sequenceFlow id="flow2" sourceRef="decision" targetRef="end1" />
        <sequenceFlow id="flow3withExternalResource" sourceRef="decision" targetRef="end2">
          <conditionExpression xsi:type="bpmn:tFormalExpression" language="javascript" js:resource="./external.js" />
        </sequenceFlow>
      </process>
    </definitions>`;

    const moddleContext = await testHelpers.moddleContext(source, {
      js: JSON.parse(factory.resource('js-bpmn-moddle.json')),
    });
    const serializer = Serializer(moddleContext, typeResolver);

    let flow = serializer.getSequenceFlowById('flow3withExternalResource');
    expect(flow.behaviour).to.have.property('conditionExpression').with.property('resource', './external.js');

    expect(serializer.getScripts()[0]).to.deep.equal({
      name: 'flow3withExternalResource',
      parent: {
        id: 'flow3withExternalResource',
        type: 'bpmn:SequenceFlow',
      },
      script: {
        resource: './external.js',
        scriptFormat: 'javascript',
        type: 'bpmn:FormalExpression',
      },
    });

    const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

    flow = deserialized.getSequenceFlowById('flow3withExternalResource');
    expect(flow.behaviour).to.have.property('conditionExpression').that.deep.equal({
      $type: 'bpmn:FormalExpression',
      language: 'javascript',
      resource: './external.js',
    });

    expect(deserialized.getScripts()[0]).to.deep.equal({
      name: 'flow3withExternalResource',
      parent: {
        id: 'flow3withExternalResource',
        type: 'bpmn:SequenceFlow',
      },
      script: {
        resource: './external.js',
        scriptFormat: 'javascript',
        type: 'bpmn:FormalExpression',
      },
    });
  });
});
