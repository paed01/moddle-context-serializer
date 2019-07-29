API
===

- [`default`](#default-export)
- [`deserialize`](#deserialize)
- [`map`](#map)
- [`Builtin TypeResolver`](#typeresolvertypemapping-extender)

## Default export

Function to make serializable context.

Arguments:
- `moddleContext`: context from `bpmn-moddle`
- `typeResolver`: type resolver function that will receive the mapped element and returns a behaviour function, or use the builtin [TypeResolver](#typeresolvertypemapping-extender)

Result:
- `id`: Definition id
- `type`: Definition type
- `name`: Definition name
- [`getActivities([scopeId])`](#getactivitiesscopeid): get activities
- `getActivityById(activityId)`: get activity by id
- `getDataObjects`: get all dataObjects
- `getDataObjectById(dataObjectId)`: get dataObject by id
- `getInboundSequenceFlows(activityId)`: get activity inbound sequence flows
- `getMessageFlows`: get all message flows
- `getOutboundSequenceFlows(activityId)`: get activity outbound sequence flows
- `getProcessById(processId)`: get process by id
- `getProcesses`: get all processes
- `getExecutableProcesses`: get all executable processes
- `getSequenceFlowById`: get sequence flow by id
- `getSequenceFlows`: get all sequence flows
- `serialize`: get stringified serialized object with [deserializable](#deserialize) content

### `getActivities([scopeId])`

Get all definition activities or pass `scopeId` to get scoped activities. Where `scopeId` can be a process or a sub-process.

## `deserialize`

Deserialize serialized content.

Arguments:
- `deserializedContext`: serialized object
- `typeResolver`: instance of a type resolver, e.g. [TypeResolver](#typeresolvertypemapping-extender)

## `map`

Do the moddle-context map.

Arguments:
- `moddleContext`: context from `bpmn-moddle`

## `TypeResolver(types[, extender])`

Builtin key value mapping to behaviour function.

Arguments:
- `types`: object with type as key and value with behaviour function
- [`extender`](#extender): optional function that will receive default type mapping by reference

Returns function that will receive mapped element and expects the function to return a behaviour function.

> NB! the resolver mutates entities and adds property `Behaviour` mapped to the passed `types`.

The default behaviour is to map moddle context `$type` property, stripped from the `bpmn:` prefix, and see if there is a corresponding property in the `typeMapping` object.

For instance:
- `bpmn:BoundaryEvent`: `types.BoundaryEvent`
- `bpmn:DataObject`: `types.DataObject`
- `bpmn:EndEvent`: `types.EndEvent`
- `bpmn:ErrorEventDefinition`: `types.ErrorEventDefinition`
- `bpmn:ExclusiveGateway`: `types.ExclusiveGateway`
- `bpmn:InclusiveGateway`: `types.InclusiveGateway`
- `bpmn:IntermediateCatchEvent`: `types.IntermediateCatchEvent`
- `bpmn:ManualTask`: `types.ManualTask`
- `bpmn:MessageEventDefinition`: `types.MessageEventDefinition`
- `bpmn:MultiInstanceLoopCharacteristics`: `types.MultiInstanceLoopCharacteristics`
- `bpmn:MessageFlow`: `types.MessageFlow`
- `bpmn:ParallelGateway`: `types.ParallelGateway`
- `bpmn:ReceiveTask`: `types.ReceiveTask`
- `bpmn:ScriptTask`: `types.ScriptTask`
- `bpmn:SendTask`: `types.SendTask`
- `bpmn:SequenceFlow`: `types.SequenceFlow`
- `bpmn:ServiceTask`: `types.ServiceTask`
- `bpmn:StartEvent`: `types.StartEvent`
- `bpmn:SubProcess`: `types.SubProcess`
- `bpmn:Task`: `types.Task`
- `bpmn:TerminateEventDefinition`: `types.TerminateEventDefinition`
- `bpmn:TimerEventDefinition`: `types.TimerEventDefinition`
- `bpmn:UserTask`: `types.UserTask`
- `bpmn:InputOutputSpecification`: `types.InputOutputSpecification`

Some default type mapping exist:

- `Definition`: `bpmn:Definitions`, singular just sounds better
- `BpmnError`: `bpmn:Error` since using `Error` is not recommended
- `ServiceImplementation`: mapped to Service- or SendTask implementation property


### Extender

Pass a function to extend mapping:

```js
import Escalation from './Escalation';
import IntermediateThrowEvent from './IntermediateThrowEvent';
import EscalationEventDefinition from './EscalationEventDefinition';

const typeResolver = TypeResolver(types, (typeMapping) => {
  typeMapping['bpmn:Escalation'] = Escalation;
  typeMapping['bpmn:IntermediateThrowEvent'] = IntermediateThrowEvent;
  typeMapping['bpmn:EscalationEventDefinition'] = EscalationEventDefinition;
});
```


