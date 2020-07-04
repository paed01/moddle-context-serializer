API
===

- [`default`](#default-export)
- [`deserialize`](#deserializedeserializedcontext-typeresolver)
- [`map`](#map)
- [`Builtin TypeResolver`](##typeresolvertypes-extender)

## Default export

Function to make serializable context.

### `Serializer(moddleContext, typeResolver[, extendFn])`

Arguments:
- `moddleContext`: context from `bpmn-moddle`
- `typeResolver`: type resolver function that will receive the mapped element and returns a behaviour function, or use the builtin [TypeResolver](##typeresolvertypes-extender)
- `extendFn`: optional function to manipulate activity behaviour

Result:
- `id`: Definition id
- `type`: Definition type
- `name`: Definition name
- [`getActivities([scopeId])`](#getactivitiesscopeid): get activities
- `getActivityById(activityId)`: get activity by id
- `getAssociationById(associationId)`: get association by id
- `getAssociations([scopeId])`: get associations for scope or all of them
- `getDataObjects`: get all dataObjects
- `getDataObjectById(dataObjectId)`: get dataObject by id
- `getInboundAssociations(activityId)`: get activity inbound associations
- `getInboundSequenceFlows(activityId)`: get activity inbound sequence flows
- `getMessageFlows`: get all message flows
- `getOutboundAssociations(activityId)`: get activity outbound associations
- `getOutboundSequenceFlows(activityId)`: get activity outbound sequence flows
- `getProcessById(processId)`: get process by id
- `getProcesses`: get all processes
- `getExecutableProcesses`: get all executable processes
- `getSequenceFlowById`: get sequence flow by id
- `getSequenceFlows([scopeId])`: get all sequence flows
- `getScripts([elementType])`: get all scripts or just for elements of type
- `getScriptsByElementId(elementId)`: get scripts for element with id
- `getTimers([elementType])`: get all timers or just for elements of type
- `getTimersByElementId(elementId)`: get timers for element with id
- `serialize`: get stringified serialized object with [deserializable](#deserialize) content

#### `extendFn(mappedBehaviour, {addScript})`

Function to manipulate activity behaviour after it is mapped.

Arguments:
- `mappedBehaviour`: the activity behaviour mapped by the serializer
  - `id`: element id
  - `type`: element type
  - `eventDefinitions`: list of event definitions
  - `loopCharacteristics`: activity multi instance loop characteristics
  - `ioSpecification`: activity ioSpecifications
  - `conditionExpression`: flow condition expression
  - `messageRef`: message reference
  - `resources`: element resources, e.g. `humanPerformer`, `potentialOwner`, and some
- `helperContext`:
  - `addScript(name, script)`: function to add a script to the global context, can be retrieved by `getScripts([elementType])` or `getScriptsByElementId(elementId)`
  - `addTimer(name, timer)`: function to add a timer to the global context, can be retrieved by `getScripts([elementType])` or `getScriptsByElementId(elementId)`

The return value will be merged with `mappedBehaviour` as a shallow copy. Hence, id and other properties can not be manipulated.

### `getActivities([scopeId])`

Get all definition activities or pass `scopeId` to get scoped activities. Where `scopeId` can be a process or a sub-process.

### `getScripts([elementType])`

Get all scripts or just for element of type.

Returns:
- list if scripts with items:
  - `name`: name of script
  - `parent`: object with parent element props:
    - `id`: parent element id
    - `type`: parent element type
  - `script`: the script
    - `type`: the type of element that holds the script
    - `scriptFormat`: script language
    - `body`: script body if any
    - `resource`: external resource if any

### `getScriptsByElementId(elementId)`

Get scripts for element with id.

### `getTimers([elementType])`

Get all timers or just for element of type.

Returns:
- list if scripts with items:
  - `name`: name of timer
  - `parent`: object with parent element props:
    - `id`: parent element id
    - `type`: parent element type
  - `timer`: the script
    - `id`: the id of element that holds the timer, if any
    - `type`: the type of element that holds the timer, if any
    - `timerType`: type of timer, e.g. `timeDuration`, `timeCycle`, `timeDate`
    - `value`: timer value, `PT1M` for instance

### `getTimersByElementId(elementId)`

Get timers for element with id.

## `deserialize(deserializedContext, typeResolver)`

Deserialize serialized content.

Arguments:
- `deserializedContext`: serialized object
- `typeResolver`: instance of a type resolver, e.g. [TypeResolver](##typeresolvertypes-extender)

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


