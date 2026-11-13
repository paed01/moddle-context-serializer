# bpmn-moddle context serializer

Make bpmn-moddle context serializable and mapped to behaviour functions

[![build](https://github.com/paed01/moddle-context-serializer/actions/workflows/build.yaml/badge.svg)](https://github.com/paed01/moddle-context-serializer/actions/workflows/build.yaml)[![coverage](https://coveralls.io/repos/github/paed01/moddle-context-serializer/badge.svg?branch=main)](https://coveralls.io/github/paed01/moddle-context-serializer?branch=main)

[`bpmn-moddle`](https://www.npmjs.com/package/bpmn-moddle) parses a BPMN 2.0 source into a graph of moddle objects that refer to each other. That graph can not be stored as JSON and is awkward for a runtime to query. This package maps it into a plain context that:

- is queried for processes, activities, sequence flows, message flows, associations, data objects, and data stores, by id or by process or sub-process scope
- has a behaviour function attached to every element, e.g. the ones from [`bpmn-elements`](https://www.npmjs.com/package/bpmn-elements)
- lists the scripts and timers found in the source, so that a runtime can prepare them up front
- serializes to JSON and deserializes again, without parsing the source a second time

It is what [`bpmn-engine`](https://www.npmjs.com/package/bpmn-engine) uses to save and resume the state of a running process.

<!-- toc -->

- [Installation](#installation)
- [Example](#example)
- [Scripts and timers](#scripts-and-timers)
  - [Scripts](#scripts)
  - [Timers](#timers)
- [Extend the type mapping](#extend-the-type-mapping)
- [Ecosystem](#ecosystem)

<!-- /toc -->

- [API](/API.md)
- [Changelog](/CHANGELOG.md)

## Installation

```sh
npm install moddle-context-serializer bpmn-moddle
```

`bpmn-moddle` is a peer dependency, version 6 and up. Node 22 is the lowest supported version.

The package ships as ES modules only. A CommonJS host can still `require('moddle-context-serializer')`, node loads the ES module natively.

## Example

Parse a source, make it a serializable context, ask it some questions, and bring it back from JSON:

```javascript
import { BpmnModdle } from 'bpmn-moddle';
import * as Elements from 'bpmn-elements';
import { Serializer, TypeResolver, deserialize } from 'moddle-context-serializer';

const source = `<?xml version="1.0" encoding="UTF-8"?>
<definitions id="order-definition" xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" targetNamespace="http://bpmn.io/schema/bpmn">
  <process id="order" isExecutable="true">
    <startEvent id="start" />
    <sequenceFlow id="to-approve" sourceRef="start" targetRef="approve" />
    <userTask id="approve" name="Approve order" />
    <boundaryEvent id="approve-timeout" attachedToRef="approve">
      <timerEventDefinition>
        <timeDuration>PT1H</timeDuration>
      </timerEventDefinition>
    </boundaryEvent>
    <sequenceFlow id="to-end" sourceRef="approve" targetRef="end" />
    <endEvent id="end" />
  </process>
</definitions>`;

const moddleContext = await new BpmnModdle().fromXML(source);

const typeResolver = TypeResolver(Elements);
const context = Serializer(moddleContext, typeResolver);

console.log(context.id);
// order-definition

console.log(context.getExecutableProcesses().map((bp) => bp.id));
// [ 'order' ]

const task = context.getActivityById('approve');
console.log(task.type, task.name, task.parent);
// bpmn:UserTask Approve order { id: 'order', type: 'bpmn:Process' }

console.log(task.Behaviour === Elements.UserTask);
// true

console.log(context.getOutboundSequenceFlows('approve').map((flow) => flow.targetId));
// [ 'end' ]

console.log(context.getTimersByElementId('approve-timeout').map(({ timer }) => `${timer.timerType} ${timer.value}`));
// [ 'timeDuration PT1H' ]

const serialized = context.serialize();

const recovered = deserialize(JSON.parse(serialized), typeResolver);

console.log(recovered.getActivityById('approve').Behaviour === Elements.UserTask);
// true
```

`serialized` is a JSON string, store it wherever you like. The behaviour functions are not part of it, they are attached again by the type resolver passed to `deserialize`.

## Scripts and timers

Scripts and timers are collected while the source is mapped and are part of the serialized context. A runtime can thereby compile, fetch, or validate them up front without walking the elements.

The snippets read sources from [test/resources](/test/resources), run them from the repository root. The sources use the Camunda namespace, e.g. `camunda:resource` and `camunda:dueDate`, so the parser is given the [`camunda-bpmn-moddle`](https://www.npmjs.com/package/camunda-bpmn-moddle) extension.

### Scripts

[`scripts.bpmn`](/test/resources/scripts.bpmn) has three script tasks followed by a gateway with four conditional flows. Three of the conditions have a script language and are scripts, the fourth is a plain expression and is not:

```javascript
import { readFile } from 'node:fs/promises';

import { BpmnModdle } from 'bpmn-moddle';
import * as Elements from 'bpmn-elements';
import camunda from 'camunda-bpmn-moddle/resources/camunda.json' with { type: 'json' };
import { Serializer, TypeResolver } from 'moddle-context-serializer';

const source = await readFile('./test/resources/scripts.bpmn', 'utf8');
const moddleContext = await new BpmnModdle({ camunda }).fromXML(source);

const context = Serializer(moddleContext, TypeResolver(Elements));

for (const { name, parent, script } of context.getScripts()) {
  console.log(parent.type, name, script.scriptFormat, script.resource ?? 'inline');
}
// bpmn:ScriptTask script-js javascript inline
// bpmn:ScriptTask script-ps1 powershell inline
// bpmn:ScriptTask script-resource javascript /scripts/embed.js
// bpmn:SequenceFlow to-javascript javascript inline
// bpmn:SequenceFlow to-powershell powershell inline
// bpmn:SequenceFlow to-resource javascript /scripts/embed.js

console.log(context.getScripts('bpmn:SequenceFlow').length);
// 3

console.log(context.getScriptsByElementId('script-js'));
// [
//   {
//     name: 'script-js',
//     parent: { id: 'script-js', type: 'bpmn:ScriptTask' },
//     script: {
//       scriptFormat: 'javascript',
//       body: 'next();',
//       type: 'bpmn:Script'
//     }
//   }
// ]
```

Scripts in extension elements, such as the Camunda input and output parameters of `script-js`, are not known to the serializer. Add them with an `extendFn`, the same way as the due date below, see [script-test.js](/test/script-test.js).

### Timers

[`timers.bpmn`](/test/resources/timers.bpmn) has a start event with a time cycle, a boundary event with a duration, an intermediate catch event with a date, and a user task with a Camunda due date. The first three are timer event definitions and are listed as is. The due date is an extension attribute, it is added as a timer by an `extendFn`:

```javascript
import { readFile } from 'node:fs/promises';

import { BpmnModdle } from 'bpmn-moddle';
import * as Elements from 'bpmn-elements';
import camunda from 'camunda-bpmn-moddle/resources/camunda.json' with { type: 'json' };
import { Serializer, TypeResolver } from 'moddle-context-serializer';

const source = await readFile('./test/resources/timers.bpmn', 'utf8');
const moddleContext = await new BpmnModdle({ camunda }).fromXML(source);

const context = Serializer(moddleContext, TypeResolver(Elements), addDueDate);

for (const { parent, timer } of context.getTimers()) {
  console.log(parent.type, parent.id, timer.timerType, timer.value);
}
// bpmn:StartEvent start-cycle timeCycle R3/PT10H
// bpmn:BoundaryEvent bound-duration timeDuration PT1M
// bpmn:IntermediateCatchEvent catch-date timeDate ${date}
// bpmn:UserTask user-due dueDate ${dueDate}

console.log(context.getTimersByElementId('bound-duration'));
// [
//   {
//     name: 'TimerEventDefinition_17vw751',
//     parent: { id: 'bound-duration', type: 'bpmn:BoundaryEvent' },
//     timer: {
//       id: 'TimerEventDefinition_17vw751',
//       timerType: 'timeDuration',
//       value: 'PT1M',
//       type: 'bpmn:TimerEventDefinition'
//     }
//   }
// ]

function addDueDate(behaviour, helperContext) {
  if (!behaviour.dueDate) return;
  helperContext.addTimer(`${behaviour.id}/dueDate`, { timerType: 'dueDate', value: behaviour.dueDate });
}
```

## Extend the type mapping

The builtin `TypeResolver` takes an extender function to add or override what an element type maps to:

```js
import { Serializer, TypeResolver } from 'moddle-context-serializer';
import { BpmnModdle } from 'bpmn-moddle';
import * as bpmnElementsBehaviour from 'bpmn-elements';

import EscalationEventDefinition from './mytypes/EscalationEventDefinition.js';

export async function getSerializedContext(source) {
  const bpmnModdle = new BpmnModdle();
  const moddleContext = await bpmnModdle.fromXML(source);
  const typeResolver = TypeResolver(bpmnElementsBehaviour, extender);
  return Serializer(moddleContext, typeResolver);
}

function extender(behaviourMapping) {
  behaviourMapping['bpmn:EscalationEventDefinition'] = EscalationEventDefinition;
}
```

## Ecosystem

Packages that build on or complement `moddle-context-serializer`:

- [bpmn-moddle](https://github.com/bpmn-io/bpmn-moddle) — BPMN 2.0 XML parser; produces the moddle context that this package maps.
- [bpmn-elements](https://github.com/paed01/bpmn-elements) — BPMN 2.0 executable elements; the behaviour functions to pass to `TypeResolver`.
- [bpmn-engine](https://github.com/paed01/bpmn-engine) — BPMN 2.0 execution engine wrapping `bpmn-elements`; serializes the context to save state and deserializes it to resume and recover flows.
- [bpmn-middleware](https://github.com/zerodep/bpmn-middleware) — Express middleware exposing the engine over HTTP, with pluggable state storage.
- [@0dep/bpmn-extensions](https://github.com/zerodep/bpmn-extensions) — Flow extensions for `bpmn-elements`: FEEL expressions and the Zeebe-namespace BPMN extension elements. Ships an `extendFn` to pass to `Serializer`.
- [@onify/flow-extensions](https://github.com/onify/flow-extensions) — Onify Flow extensions for `bpmn-elements`. Ships an `extendFn` to pass to `Serializer`.
- [BPMN Runner](https://0dep.se/run/) — Browser-based BPMN 2.0 and DMN runner built on `bpmn-elements`, `@0dep/bpmn-extensions`, and `dmn-elements`; run and step through diagrams client-side with live element highlighting, no data leaves the browser.
