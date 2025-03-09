import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';

import { default as Serializer, TypeResolver, deserialize } from '../src/index.js';

const typeResolver = TypeResolver(types);

describe('deserialize', () => {
  it('getScripts returns empty array if serialized without scripts', async () => {
    const source = `
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <scriptTask id="activity">
          <bpmn:script>next();</bpmn:script>
        </scriptTask>
      </process>
    </definitions>`;

    const moddleContext = await testHelpers.moddleContext(source);
    const state = Serializer(moddleContext, typeResolver).serialize();

    const context = JSON.parse(state);
    expect(context.scripts).to.have.length(1);
    delete context.scripts;

    expect(deserialize(context, typeResolver).getScripts()).to.have.length(0);
  });

  it('add script with extendContext.addScript function adds scripts', async () => {
    const source = `
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <scriptTask id="activity" scriptFormat="javascript">
          <bpmn:script>next();</bpmn:script>
        </scriptTask>
      </process>
    </definitions>`;

    const moddleContext = await testHelpers.moddleContext(source);
    const state = Serializer(moddleContext, typeResolver).serialize();

    const context = JSON.parse(state);
    const scripts = context.scripts;

    expect(scripts).to.have.length(1);

    delete context.scripts;

    const deserialized = deserialize(context, typeResolver);

    const extendContext = deserialized.getExtendContext();
    const activity = deserialized.getActivityById('activity');

    extendContext.addScript(activity.id, {
      parent: {
        id: activity.id,
        type: activity.type,
      },
      scriptFormat: activity.behaviour.scriptFormat,
      body: activity.behaviour.script,
      type: 'bpmn:Script',
    });

    expect(deserialized.getScripts()).to.deep.equal(scripts);
  });

  it('getTimers returns empty array if serialized without timers', async () => {
    const source = `
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <intermediateCatchEvent id="activity">
          <timerEventDefinition>
            <timeDuration xsi:type="tFormalExpression">PT1M</timeDuration>
          </timerEventDefinition>
        </intermediateCatchEvent>
      </process>
    </definitions>`;

    const moddleContext = await testHelpers.moddleContext(source);
    const state = Serializer(moddleContext, typeResolver).serialize();

    const context = JSON.parse(state);

    expect(context.timers).to.have.length(1);
    delete context.timers;

    expect(deserialize(context, typeResolver).getTimers()).to.have.length(0);
  });

  it('add timer with extendContext.addTimer function adds timer', async () => {
    const source = `
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <intermediateCatchEvent id="activity">
          <timerEventDefinition>
            <timeDuration xsi:type="tFormalExpression">PT1M</timeDuration>
          </timerEventDefinition>
        </intermediateCatchEvent>
      </process>
    </definitions>`;

    const moddleContext = await testHelpers.moddleContext(source);
    const state = Serializer(moddleContext, typeResolver).serialize();

    const context = JSON.parse(state);
    const timers = context.timers;

    expect(timers).to.have.length(1);

    delete context.timers;

    const deserialized = deserialize(context, typeResolver);

    const extendContext = deserialized.getExtendContext();
    const activity = deserialized.getActivityById('activity');

    extendContext.addTimer('timeDuration', {
      parent: activity,
      timerType: 'timeDuration',
      type: activity.behaviour.eventDefinitions[0].type,
      value: activity.behaviour.eventDefinitions[0].behaviour.timeDuration,
    });

    expect(deserialized.getTimers()).to.deep.equal(timers);
  });
});
