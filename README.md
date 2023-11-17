bpmn-moddle context serializer
==============================

Make bpmn-moddle context serializable and mapped to behaviour functions

[![build](https://github.com/paed01/moddle-context-serializer/actions/workflows/build.yaml/badge.svg)](https://github.com/paed01/moddle-context-serializer/actions/workflows/build.yaml)[![coverage](https://coveralls.io/repos/github/paed01/moddle-context-serializer/badge.svg?branch=master)](https://coveralls.io/github/paed01/moddle-context-serializer?branch=master)

- [API](/API.md)

# Documentation

The tests are the documentation. Hence, please study [test](/test/serializer-test.js)

A basic example:
```js
import { Serializer, TypeResolver } from 'moddle-context-serializer';
import BpmnModdle from 'bpmn-moddle';
import * as bpmnElementsBehaviour from 'bpmn-elements';

import EscalationEventDefinition from './mytypes/EscalationEventDefinition';


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
