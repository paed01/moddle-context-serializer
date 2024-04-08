import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';

import { default as Serializer, TypeResolver } from '../index.js';

const typeResolver = TypeResolver(types);

describe('edge-cases (mainly for coverage)', () => {
  it('empty moddle context throws', () => {
    expect(() => Serializer({}, typeResolver)).to.throw(TypeError);
  });

  it('event definition null is ignored', () => {
    const mc = {
      rootElement: {
        $type: 'bpmn:Definition',
        rootElements: [
          {
            id: 'my-process',
            $type: 'bpmn:Process',
            flowElements: [
              {
                id: 'start',
                $type: 'bpmn:StartEvent',
                eventDefinitions: [null],
              },
            ],
          },
        ],
      },
      references: [],
    };

    const context = Serializer(mc, typeResolver);
    expect(context.getActivityById('start').behaviour).to.have.property('eventDefinitions').that.is.empty;
  });

  it('data object reference not found is ignored', async () => {
    const source = `<?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="task-definitions" targetNamespace="http://bpmn.io/schema/bpmn">
      <process id="Process_1" isExecutable="true">
        <userTask id="task">
          <ioSpecification>
            <dataInput id="activityInput" />
            <dataOutput id="activityOutput" />
          </ioSpecification>
          <dataInputAssociation id="dataInputAssociation">
            <sourceRef>myNonDataRef</sourceRef>
            <targetRef>activityInput</targetRef>
          </dataInputAssociation>
          <dataOutputAssociation id="dataOutputAssociation">
            <sourceRef>activityOutput</sourceRef>
            <targetRef>myDataRef</targetRef>
          </dataOutputAssociation>
        </userTask>
        <dataObject id="myData" />
        <dataObjectReference id="myDataRef" dataObjectRef="myData" />
      </process>
    </definitions>`;

    const mc = await testHelpers.moddleContext(source);
    const context = Serializer(mc, typeResolver);
    const activity = context.getActivityById('task');
    expect(activity.behaviour).to.have.property('ioSpecification');
  });

  it('single boundary event', async () => {
    const source = `<?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="task-definitions" targetNamespace="http://bpmn.io/schema/bpmn">
      <process id="Process_1" isExecutable="true">
        <boundaryEvent id="event" />
      </process>
    </definitions>`;

    const mc = await testHelpers.moddleContext(source);
    const context = Serializer(mc, typeResolver);
    const activity = context.getActivityById('event');
    expect(activity).to.have.property('id', 'event');
  });
});
