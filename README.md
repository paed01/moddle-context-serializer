bpmn-moddle context serializer
==============================

Make bpmn-moddle context serializable and mapped to behaviour functions

[![Build Status](https://travis-ci.org/paed01/moddle-context-serializer.svg?branch=master)](https://travis-ci.org/paed01/moddle-context-serializer)

- [API](/API.md)

# Documentation

The tests are the documentation. Hence, please study [test](/test/serializer-test.js)

A basic example:
```js
import {default as Serializer, TypeResolver} from 'moddle-context-serializer';
import * as bpmnElementsBehaviour from 'bpmn-elements';

import EscalationEventDefinition from './mytypes/EscalationEventDefinition';

import BpmnModdle from 'bpmn-moddle';

export async function getSerializedContext(source) {
  const moddleContext = await getModdleContext(source);
  const typeResolver = TypeResolver(bpmnElementsBehaviour, extender);
  return Serializer(moddleContext, typeResolver);
}

function extender(behaviourMapping) {
  behaviourMapping['bpmn:EscalationEventDefinition'] = EscalationEventDefinition;
}

function getModdleContext(source) {
  const bpmnModdle = new BpmnModdle();

  return new Promise((resolve, reject) => {
    bpmnModdle.fromXML(source, (err, definitions, moddleCtx) => {
      if (err) return reject(err);
      resolve(moddleCtx);
    });
  });
}
```
