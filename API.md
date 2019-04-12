API
===

- [`default`](#default-export)
- [`deserialize`](#deserialize)
- [`map`](#map)
- [`Builtin TypeResolver`](#typeresolvertypemapping)

## Default export

Function to make serializable context.

Arguments:
- `moddleContext`: context from `bpmn-moddle`
- `typeResolver`: type resolver function that will receive the mapped element and returns a behaviour function, or use the builtin [TypeResolver](#typeresolvertypemapping_extender)

Result:
- `id`: Definition id
- `type`: Definition type
- `name`: Definition name
- [`getActivities([scopeId])`](#getactivitiesscopeid): get activities
- `getActivityById(activityId)`: get activity by id
- `getDataObjects`: get all dataObjects
- `getDataObjectById(dataObjectId)`: get dataObject by id
- `getErrorById`: get error by id
- `getErrors`: get all errors
- `getInboundSequenceFlows(activityId)`: get activity inbound sequence flows
- `getMessageFlows`: get all message flows
- `getOutboundSequenceFlows(activityId)`: get activity outbound sequence flows
- `getProcessById(processId)`: get process by id
- `getProcesses`: get all processes
- `getExecutableProcesses`: get all executable processes
- `getSequenceFlowById`: get sequence flow by id
- `getSequenceFlows`: get all sequence flows
- `serialize`: get stringified serialized object with [deserializable](#deserialize) content

```js

```

### `getActivities([scopeId])`

Get all definition activities or pass `scopeId` to get scoped activities. Where `scopeId` can be a process or a sub-process.

## `deserialize`

Deserialize serialized content.

Arguments:
- `deserializedContext`: serialized object
- `typeResolver`: instance of a type resolver, e.g. [TypeResolver](#typeresolvertypemapping)

## `map`

Do the moddle-context map.

Arguments:
- `moddleContext`: context from `bpmn-moddle`

## `TypeResolver(typeMapping[, extender])`

Builtin key value mapping to behaviour function.

Arguments:
- `typeMapping`: object with type as key and value with behaviour function
- [`extender`](#extender): optional function that will receive default type mapping by reference

Returns function that will receive mapped element and expects the function to return a behaviour function.

> NB! the resolver mutates entities and adds property `Behaviour` mapped to the passed `typeMapping`.

Default type mapping:

- `BoundaryEvent`: `bpmn:BoundaryEvent`
- `DataObject`: `bpmn:DataObject`
- `Definitions`: `bpmn:Definitions`
- `EndEvent`: `bpmn:EndEvent`
- `BpmnError`: `bpmn:Error`
- `ErrorEventDefinition`: `bpmn:ErrorEventDefinition`
- `ExclusiveGateway`: `bpmn:ExclusiveGateway`
- `InclusiveGateway`: `bpmn:InclusiveGateway`
- `IntermediateCatchEvent`: `bpmn:IntermediateCatchEvent`
- `SignalTask`: `bpmn:ManualTask`
- `MessageEventDefinition`: `bpmn:MessageEventDefinition`
- `MessageFlow`: `bpmn:MessageFlow`
- `Process`: `bpmn:Process`
- `ParallelGateway`: `bpmn:ParallelGateway`
- `SignalTask`: `bpmn:ReceiveTask`
- `ScriptTask`: `bpmn:ScriptTask`
- `ServiceTask`: `bpmn:SendTask`
- `SequenceFlow`: `bpmn:SequenceFlow`
- `ServiceTask`: `bpmn:ServiceTask`
- `StartEvent`: `bpmn:StartEvent`
- `SubProcess`: `bpmn:SubProcess`
- `Task`: `bpmn:Task`
- `TerminateEventDefinition`: `bpmn:TerminateEventDefinition`
- `TimerEventDefinition`: `bpmn:TimerEventDefinition`
- `SignalTask`: `bpmn:UserTask`
- `MultiInstanceLoopCharacteristics`: `bpmn:MultiInstanceLoopCharacteristics`
- `IoSpecification`: `bpmn:InputOutputSpecification`

### Extender

Pass a function to extend mapping:

```js
import Escalation from './Escalation';
import IntermediateThrowEvent from './IntermediateThrowEvent';
import EscalationEventDefinition from './EscalationEventDefinition';

const typeResolver = TypeResolver(types, (activityTypes) => {
  activityTypes['bpmn:Escalation'] = Escalation;
  activityTypes['bpmn:IntermediateThrowEvent'] = IntermediateThrowEvent;
  activityTypes['bpmn:EscalationEventDefinition'] = EscalationEventDefinition;
});
```


