API
===

- [`default`](#default-export)
- [`deserialize`](#deserialize)
- [`map`](#map)
- [`TypeResolver`](#typeresolver)

## Default export

Function to make serializable content.

Arguments:
- `moddleContext`: context from `bpmn-moddle`
- `typeResolver`: instance of a type resolver, e.g. [TypeResolver](#typeresolver)

Result:
- `id`: Definition id
- `type`: Definition type
- `name`: Definition name
- `getActivities`: get all definition activities
- `getActivityById(activityId)`: get activity by id
- `getDataObjects`: get all dataObjects
- `getDataObjectById(dataObjectId)`: get dataObject by id
- `getErrorById`: get error by id
- `getErrors`: get all errors
- `getInboundSequenceFlows(activityId)`: get activity inbound sequence flows
- `getMessageFlows`: get all message flows
- `getOutboundSequenceFlows`: get activity outbound sequence flows
- `getProcessById(processId)`: get process by id
- `getProcesses`: get all processes
- `getSequenceFlowById`: get sequence flow by id
- `getSequenceFlows`: get all sequence flows
- `serialize`: get stringified serialized object with [deserializable](#deserialize) content

## `deserialize`

Deserialize serialized content.

Arguments:
- `deserializedContext`: serialized object
- `typeResolver`: instance of a type resolver, e.g. [TypeResolver](#typeresolver)

## `map`

Do the moddle-context map.

Arguments:
- `moddleContext`: context from `bpmn-moddle`

## `TypeResolver`

Key value mapping to behaviour.

Arguments:
- `typeMapping`: object with type as key and value with behaviour function

> NB! the resolver mutates entities and adds property `Behaviour` mapped to the passed `typeMapping`.

The following type mapping is currently supported:

- `BoundaryEvent`: `bpmn:BoundaryEvent`
- `Dummy`: `bpmn:DataObjectReference`
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
