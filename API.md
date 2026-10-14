# API

<!-- toc -->

- [Named exports](#named-exports)
- [`Serializer(moddleContext, typeResolver[, extendFn])`](#serializermoddlecontext-typeresolver-extendfn)
  - [`extendFn(mappedBehaviour, helperContext)`](#extendfnmappedbehaviour-helpercontext)
- [`SerializableContext`](#serializablecontext)
  - [`getActivities([scopeId])`](#getactivitiesscopeid)
  - [`getExtendContext()`](#getextendcontext)
    - [addScript(name, script)](#addscriptname-script)
    - [addTimer(name, timer)](#addtimername-timer)
  - [`getScripts([elementType])`](#getscriptselementtype)
  - [`getScriptsByElementId(elementId)`](#getscriptsbyelementidelementid)
  - [`getTimers([elementType])`](#gettimerselementtype)
  - [`getTimersByElementId(elementId)`](#gettimersbyelementidelementid)
  - [`serialize()`](#serialize)
- [`deserialize(deserializedContext, typeResolver)`](#deserializedeserializedcontext-typeresolver)
- [`map(moddleContext[, extendFn])`](#mapmoddlecontext-extendfn)
- [`resolveTypes(mappedContext, typeResolver)`](#resolvetypesmappedcontext-typeresolver)
- [`TypeResolver(types[, extender])`](#typeresolvertypes-extender)
  - [Extender](#extender)

<!-- /toc -->

## Named exports

There is no default export. Everything is imported by name:

```js
import { Serializer, deserialize, map, TypeResolver, SerializableContext, resolveTypes, ExtendContext } from 'moddle-context-serializer';
```

CJS consumers destructure the same names from `require('moddle-context-serializer')`.

- [`Serializer(moddleContext, typeResolver[, extendFn])`](#serializermoddlecontext-typeresolver-extendfn): map a `bpmn-moddle` context and attach behaviours
- [`deserialize(deserializedContext, typeResolver)`](#deserializedeserializedcontext-typeresolver): hydrate a previously serialized context
- [`map(moddleContext[, extendFn])`](#mapmoddlecontext-extendfn): map only, no behaviours attached
- [`TypeResolver(types[, extender])`](#typeresolvertypes-extender): builtin type to behaviour resolver
- [`SerializableContext(mappedContext)`](#serializablecontext): the query API returned by `Serializer` and `deserialize`
- [`resolveTypes(mappedContext, typeResolver)`](#resolvetypesmappedcontext-typeresolver): attach behaviours to a mapped context
- [`ExtendContext`](#getextendcontext): script and timer collector, normally reached through `getExtendContext()` or the `extendFn` helper argument

## `Serializer(moddleContext, typeResolver[, extendFn])`

Function to make serializable context.

Arguments:

- `moddleContext`: context from [`bpmn-moddle`](https://www.npmjs.com/package/bpmn-moddle)
- `typeResolver`: type resolver function that will receive the mapped element and attach a behaviour function, or use the builtin [TypeResolver](#typeresolvertypes-extender)
- [`extendFn`](#extendfnmappedbehaviour-helpercontext): optional function to manipulate element behaviour

Returns a [`SerializableContext`](#serializablecontext).

### `extendFn(mappedBehaviour, helperContext)`

Function to manipulate element behaviour after it is mapped. It is called for every mapped element that carries behaviour: processes, activities, sequence flows, message flows, associations, data objects and data stores.

Arguments:

- `mappedBehaviour`: the element behaviour mapped by the serializer. Besides the moddle element properties the following are prepared:
  - `id`: element id
  - `type`: element type
  - `eventDefinitions`: list of mapped event definitions
  - `loopCharacteristics`: mapped activity loop characteristics
  - `ioSpecification`: mapped activity ioSpecification
  - `properties`: mapped list of `bpmn:Property`, as `{ type: 'properties', values }`
  - `dataInputAssociations` and `dataOutputAssociations`: mapped data associations
  - `lanes`: mapped lanes, flattened from the process lane sets
  - `resources`: element resources, e.g. `humanPerformer` and `potentialOwner`, as `{ type, expression, behaviour }`
  - `messageRef`: message reference as `{ id, type, name }`
  - `conditionExpression`: flow condition expression. If it has a `language` the expression is also added as a script
- `helperContext`: an [`ExtendContext`](#getextendcontext) bound to the current element. Scripts and timers added through it get the element as `parent` unless another parent is passed

The return value will be merged with `mappedBehaviour` as a shallow copy, with `mappedBehaviour` taking precedence. Hence, `id`, `type` and other mapped properties can not be manipulated, but defaults can be supplied.

## `SerializableContext`

Returned by [`Serializer`](#serializermoddlecontext-typeresolver-extendfn) and [`deserialize`](#deserializedeserializedcontext-typeresolver). Can also be constructed directly from a mapped context with behaviours attached, i.e. the result of [`resolveTypes`](#resolvetypesmappedcontext-typeresolver).

Properties:

- `id`: Definition id
- `type`: Definition type
- `name`: Definition name
- `elements`: the mapped context, an object with `definition`, `processes`, `activities`, `sequenceFlows`, `messageFlows`, `associations`, `dataObjects`, `dataStores`, `participants`, `scripts`, and `timers`

Methods:

- [`getActivities([scopeId])`](#getactivitiesscopeid): get activities
- `getActivityById(activityId)`: get activity by id
- `getAssociationById(associationId)`: get association by id
- `getAssociations([scopeId])`: get associations for scope or all of them
- `getDataObjects([scopeId])`: get dataObjects for scope or all of them
- `getDataObjectById(dataObjectId)`: get dataObject by id
- `getDataStoreReferences([scopeId])`: get dataStoreReferences for scope or all of them, data stores included
- `getDataStoreReferenceById(dataStoreId)`: get dataStoreReference by id
- `getDataStores()`: get all dataStores, i.e. elements of type `bpmn:DataStore` only
- `getDataStoreById(dataStoreId)`: get dataStore by id
- [`getExtendContext()`](#getextendcontext): get extend functions and properties
- `getInboundAssociations(activityId)`: get activity inbound associations
- `getInboundSequenceFlows(activityId)`: get activity inbound sequence flows
- `getMessageFlows([scopeId])`: get message flows with source in scope or all of them
- `getOutboundAssociations(activityId)`: get activity outbound associations
- `getOutboundSequenceFlows(activityId)`: get activity outbound sequence flows
- `getProcessById(processId)`: get process by id
- `getProcesses()`: get all processes
- `getExecutableProcesses()`: get all executable processes
- `getSequenceFlowById(flowId)`: get sequence flow by id
- `getSequenceFlows([scopeId])`: get sequence flows for scope or all of them
- [`getScripts([elementType])`](#getscriptselementtype): get all scripts or just for elements of type
- [`getScriptsByElementId(elementId)`](#getscriptsbyelementidelementid): get scripts for element with id
- [`getTimers([elementType])`](#gettimerselementtype): get all timers or just for elements of type
- [`getTimersByElementId(elementId)`](#gettimersbyelementidelementid): get timers for element with id
- [`serialize()`](#serialize): get stringified serialized object with deserializable content

Where `scopeId` is the id of a process or a sub-process.

### `getActivities([scopeId])`

Get all definition activities or pass `scopeId` to get scoped activities. Where `scopeId` can be a process or a sub-process.

### `getExtendContext()`

Returns an ExtendContext instance:

- `scripts`: list of known scripts
- `timers`: list of known timers
- `addScript(name, script)`: function to add a script to the global context, can be retrieved by [`getScripts`](#getscriptselementtype) or [`getScriptsByElementId`](#getscriptsbyelementidelementid)
- `addTimer(name, timer)`: function to add a timer to the global context, can be retrieved by [`getTimers`](#gettimerselementtype) or [`getTimersByElementId`](#gettimersbyelementidelementid)

The instance returned here has no bound parent element, so pass `parent` when adding scripts or timers. The one passed to [`extendFn`](#extendfnmappedbehaviour-helpercontext) defaults `parent` to the element being mapped.

#### addScript(name, script)

Add known script.

Arguments:

- `name`: name of script
- `script`: script object
  - `parent`: parent element as an object with `id` and `type`. Required to find the script by element id or type
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
  - `parent`: parent element as an object with `id` and `type`. Required to find the timer by element id or type
  - `id`: optional id as string that makes it easy to distinguish
  - `type`: optional type of element that holds the timer
  - `timerType`: timer type as string
  - `value`: timer value

### `getScripts([elementType])`

Get all scripts or just for element of type. Can be used to generate a script resource with all scripts if running in strict mode.

Returns list of scripts with items:

- `name`: name of script
- `parent`: object with parent element props:
  - `id`: parent element id
  - `type`: parent element type
- `script`: the script
  - `id`: the id of element that holds the script, if any
  - `type`: the type of element that holds the script
  - `scriptFormat`: script language
  - `body`: script body if any
  - `resource`: external resource if any

### `getScriptsByElementId(elementId)`

Get scripts for element with id.

### `getTimers([elementType])`

Get all timers or just for element of type.

Returns list of timers with items:

- `name`: name of timer
- `parent`: object with parent element props:
  - `id`: parent element id
  - `type`: parent element type
- `timer`: the timer
  - `id`: the id of element that holds the timer, if any
  - `type`: the type of element that holds the timer, if any
  - `timerType`: type of timer, e.g. `timeDuration`, `timeCycle`, `timeDate`
  - `value`: timer value, `PT1M` for instance

### `getTimersByElementId(elementId)`

Get timers for element with id.

### `serialize()`

Returns the entire definition as a JSON string. Parse it and pass the result to [`deserialize`](#deserializedeserializedcontext-typeresolver) to get the context back.

## `deserialize(deserializedContext, typeResolver)`

Deserialize serialized content.

Arguments:

- `deserializedContext`: parsed output of [`serialize()`](#serialize)
- `typeResolver`: instance of a type resolver, e.g. [TypeResolver](#typeresolvertypes-extender)

Returns a [`SerializableContext`](#serializablecontext).

## `map(moddleContext[, extendFn])`

Do the moddle-context map without attaching behaviours. Useful to inspect or modify the structure before wiring up behaviours with [`resolveTypes`](#resolvetypesmappedcontext-typeresolver).

Arguments:

- `moddleContext`: context from `bpmn-moddle`
- [`extendFn`](#extendfnmappedbehaviour-helpercontext): optional function to manipulate element behaviour

Returns the mapped context, see `elements` in [`SerializableContext`](#serializablecontext).

## `resolveTypes(mappedContext, typeResolver)`

Run the type resolver against every element in a mapped context that may carry behaviour: definition, processes, activities, data objects, data stores, message flows, sequence flows, and associations.

Arguments:

- `mappedContext`: the result of [`map`](#mapmoddlecontext-extendfn) or a parsed [`serialize()`](#serialize) string
- `typeResolver`: type resolver function, e.g. [TypeResolver](#typeresolvertypes-extender)

Returns the same, mutated, `mappedContext`.

## `TypeResolver(types[, extender])`

Builtin key value mapping to behaviour function.

Arguments:

- `types`: object with type as key and value with behaviour function
- [`extender`](#extender): optional function that will receive default type mapping by reference

Returns function that will receive mapped element and attach a behaviour function.

> NB! the resolver mutates entities and adds property `Behaviour` mapped to the passed `types`.

The resolver looks up the mapped element `type`, i.e. the moddle `$type`, in two steps:

1. the `typeMapping` object, keyed by prefixed type, holding the defaults below and anything added by the [extender](#extender)
2. the passed `types` object, keyed by type stripped from the `bpmn:` prefix

If neither has a match an `Unknown activity type` error is thrown.

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
- `Dummy`: `bpmn:DataObjectReference`
- `ServiceImplementation`: attached as `Service` on Service- or SendTask behaviour with an implementation property
- `Properties`: behaviour for list of `bpmn:Property`'s

The resolver also recurses into the element behaviour and resolves `eventDefinitions`, `loopCharacteristics`, `ioSpecification`, and `lanes`.

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
