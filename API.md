# API

- [`default`](#default-export)
- [`deserialize`](#deserializedeserializedcontext-typeresolver)
- [`map`](#map)
- [`Builtin TypeResolver`](#typeresolvertypes-extender)

## Default export

Function to make serializable context.

### `Serializer(moddleContext, typeResolver[, extendFn])`

Arguments:

- `moddleContext`: context from [`bpmn-moddle`](https://www.npmjs.com/package/bpmn-moddle)
- `typeResolver`: type resolver function that will receive the mapped element and returns a behaviour function, or use the builtin [TypeResolver](##typeresolvertypes-extender)
- [`extendFn`](#extendfnmappedbehaviour-helpercontext): optional function to manipulate activity behaviour

Result:

- `id`: Definition id
- `type`: Definition type
- `name`: Definition name
- `elements`: object with elements
- [`getActivities([scopeId])`](#getactivitiesscopeid): get activities
- `getActivityById(activityId)`: get activity by id
- `getAssociationById(associationId)`: get association by id
- `getAssociations([scopeId])`: get associations for scope or all of them
- `getDataObjects([scopeId])`: get dataObjects for scope or all of them
- `getDataObjectById(dataObjectId)`: get dataObject by id
- `getDataStoreReferences([scopeId])`: get dataStoreReferences for scope or all of them
- `getDataStoreReferenceById(dataStoreId)`: get dataStoreReference by id
- `getDataStores()`: get all dataStores
- `getDataStoreById(dataStoreId)`: get dataStore by id
- `getExtendContext()`: get extend functions and properties
- `getInboundAssociations(activityId)`: get activity inbound associations
- `getInboundSequenceFlows(activityId)`: get activity inbound sequence flows
- `getMessageFlows`: get all message flows
- `getOutboundAssociations(activityId)`: get activity outbound associations
- `getOutboundSequenceFlows(activityId)`: get activity outbound sequence flows
- `getProcessById(processId)`: get process by id
- `getProcesses`: get all processes
- `getExecutableProcesses`: get all executable processes
- `getSequenceFlowById(flowId)`: get sequence flow by id
- `getSequenceFlows([scopeId])`: get all sequence flows
- [`getScripts([elementType])`](#getscriptselementtype): get all scripts or just for elements of type
- [`getScriptsByElementId(elementId)`](#getscriptsbyelementidelementid): get scripts for element with id
- [`getTimers([elementType])`](#gettimerselementtype): get all timers or just for elements of type
- [`getTimersByElementId(elementId)`](#gettimersbyelementidelementid): get timers for element with id
- `serialize`: get stringified serialized object with [deserializable](#deserialize) content

#### `extendFn(mappedBehaviour, helperContext)`

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
- `helperContext`: the result of [getExtendContext()](#getextendcontext)

The return value will be merged with `mappedBehaviour` as a shallow copy. Hence, id and other properties can not be manipulated.

### `getActivities([scopeId])`

Get all definition activities or pass `scopeId` to get scoped activities. Where `scopeId` can be a process or a sub-process.

### `getExtendContext()`

Returns an ExtendContext instance:

- `scripts`: list of known scripts
- `timers`: list of known timers
- `addScript(name, script)`: function to add a script to the global context, can be retrieved by [`getScripts`](#getscriptselementtype) or [`getScriptsByElementId`](#getscriptsbyelementidelementid)
- `addTimer(name, timer)`: function to add a timer to the global context, can be retrieved by [`getTimers`](#gettimerselementtype) or [`getTimersByElementId`](#gettimersbyelementidelementid)

#### addScript(name, script)

Add known script.

Arguments:

- `name`: name of script
- `script`: script object
  - `parent`: parent element as an object with `id` and `type`
  - `id`: optional id as string that makes it easy to distinguish
  - `type`: element type that holds script, e.g. `bpmn:Script`
  - `scriptFormat`: script language
  - `body`: optional script body as string
  - `resource`: external resource if any

#### addTimer(name, timer)

Add known timer.

Arguments:

- `name`: name of timer
- `timer`: timer object
  - `parent`: parent element as an object with `id` and `type`
  - `id`: optional id as string that makes it easy to distinguish
  - `timerType`: timer type as string
  - `value`: timer value

### `getScripts([elementType])`

Get all scripts or just for element of type. Can be used to generate a script resource with all scripts if running in strict mode.

Returns list if scripts with items:

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
- `Properties`: behaviour for list of `bpmn:Property`'s

### Extender

Pass a function to extend mapping:

```js
import Escalation from './Escalation.js';
import IntermediateThrowEvent from './IntermediateThrowEvent.js';
import EscalationEventDefinition from './EscalationEventDefinition.js';

const typeResolver = TypeResolver(types, (typeMapping) => {
  typeMapping['bpmn:Escalation'] = Escalation;
  typeMapping['bpmn:IntermediateThrowEvent'] = IntermediateThrowEvent;
  typeMapping['bpmn:EscalationEventDefinition'] = EscalationEventDefinition;
});
```
