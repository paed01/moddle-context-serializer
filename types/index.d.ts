declare module 'moddle-context-serializer' {
	import type { Association, BaseElement, BPMNModel, DataObject, DataObjectReference, DataStore, DataStoreReference, Definitions as ModdleDefinitions, FlowNode, MessageFlow, Process as ModdleProcess, SequenceFlow } from 'bpmn-moddle';
	/**
	 * Build a default behaviour resolver from a type registry.
	 *
	 * @param types - type-name to behaviour-function map (without `bpmn:` prefix)
	 * @param extender - receives the internal mapper for overrides/additions
	 * */
	export function TypeResolver(types: Record<string, any>, extender?: TypeResolverExtender): ResolverFn_1;
	/**
	 * Map a moddle context into the normalized {@link import('types').MappedContext} shape
	 * without resolving behaviour types. Useful when you want to introspect or modify the
	 * structure before wiring up behaviours.
	 *
	 * */
	export function map(moddleContext: BPMNModel, extendFn?: ExtendFn_1): MappedContext_1;
	/**
	 * Build a serializable, behaviour-mapped context from a `bpmn-moddle` parse result.
	 *
	 * */
	export default function Serializer_1(moddleContext: BPMNModel, typeResolver: ResolverFn_1, extendFn?: ExtendFn_1): SerializableContext;
	/**
	 * Hydrate a previously-serialized context (output of {@link SerializableContext.serialize})
	 * back into a queryable, behaviour-mapped context.
	 *
	 * @param deserializedContext - the parsed JSON produced by `serialize()`
	 * */
	export function deserialize(deserializedContext: any, typeResolver: ResolverFn_1): SerializableContext;

	export function SerializableContext(elements: MappedContext_1): void;
	export class SerializableContext {
		
		constructor(elements: MappedContext_1);
		id: string;
		type: string;
		name: string;
		elements: MappedContext_1;
		
		serialize(): string;
		
		getProcessById(processId: string): MappedProcess_1 | undefined;
		
		getProcesses(): MappedProcess_1[];
		
		getExecutableProcesses(): MappedProcess_1[];
		
		getInboundSequenceFlows(activityId: string): MappedSequenceFlow_1[];
		
		getOutboundSequenceFlows(activityId: string): MappedSequenceFlow_1[];
		
		getMessageFlows(scopeId?: string): MappedMessageFlow_1[];
		/**
		 * Get sequence flows
		 * @param scopeId filter sequence flows by process or sub-process
		 * */
		getSequenceFlows(scopeId?: string): MappedSequenceFlow_1[];
		
		getSequenceFlowById(flowId: string): MappedSequenceFlow_1 | undefined;
		
		getActivities(scopeId?: string): MappedActivity_1[];
		
		getDataObjects(scopeId?: string): MappedDataObject_1[];
		
		getDataStoreReferences(scopeId?: string): MappedDataStore_1[];
		
		getDataObjectById(dataObjectId: string): MappedDataObject_1 | undefined;
		
		getDataStoreReferenceById(dataStoreId: string): MappedDataStore_1 | undefined;
		
		getDataStores(): MappedDataStore_1[];
		
		getDataStoreById(dataStoreId: string): MappedDataStore_1 | undefined;
		
		getActivityById(activityId: string): MappedActivity_1 | undefined;
		
		getAssociations(scopeId?: string): MappedAssociation_1[];
		
		getAssociationById(associationId: string): MappedAssociation_1 | undefined;
		
		getExtendContext(): ExtendContext;
		
		getInboundAssociations(activityId: string): MappedAssociation_1[];
		
		getOutboundAssociations(activityId: string): MappedAssociation_1[];
		
		getScripts(elementType?: string): Script_1[];
		
		getScriptsByElementId(elementId: string): Script_1[];
		
		getTimers(elementType?: string): Timer_1[];
		
		getTimersByElementId(elementId: string): Timer_1[];
	}
	/**
	 * Walk a mapped context and run the resolver against every element that may carry behaviour.
	 * The resolver is expected to mutate each entity by attaching a `Behaviour` property.
	 *
	 * */
	export function resolveTypes(mappedContext: MappedContext_1, typeResolver: ResolverFn_1): MappedContext_1;
	export type MappedContext = MappedContext_1;
	export type MappedActivity = MappedActivity_1;
	export type MappedProcess = MappedProcess_1;
	export type MappedSequenceFlow = MappedSequenceFlow_1;
	export type MappedAssociation = MappedAssociation_1;
	export type MappedMessageFlow = MappedMessageFlow_1;
	export type MappedDataObject = MappedDataObject_1;
	export type MappedDataStore = MappedDataStore_1;
	export type MappedParticipant = MappedParticipant_1;
	export type MappedBehaviour = MappedBehaviour_1<any>;
	export type SerializableElement = SerializableElement_1;
	export type Parent = Parent_1;
	export type Script = Script_1;
	export type Timer = Timer_1;
	export type Definition = Definition_1;
	export type ResolverFn = ResolverFn_1;
	export type ExtendFn = ExtendFn_1;
  interface Parent_1 {
	id?: string;
	type?: string;
	[x: string]: any;
  }

  interface ScriptElement {
	id?: string;
	type?: string;
	scriptFormat?: string;
	body?: string;
	resource?: string;
	parent?: Parent_1;
	[x: string]: any;
  }

  interface TimerElement {
	id?: string;
	type?: string;
	timerType?: string;
	value?: string;
	parent?: Parent_1;
	[x: string]: any;
  }

  interface Script_1 {
	name: string;
	parent?: Parent_1;
	script: ScriptElement;
  }

  interface Timer_1 {
	name: string;
	parent?: Parent_1;
	timer: TimerElement;
  }

  interface SerializableElement_1<TBehaviour = Record<string, any>> {
	id?: string;
	type?: string;
	parent?: Parent_1;
	behaviour: TBehaviour;
	Behaviour?: CallableFunction;
	[key: string]: any;
  }

  interface Definition_1 extends Pick<ModdleDefinitions, 'id' | 'name' | 'targetNamespace'> {
	type: string;
	exporter: string;
	exporterVersion: string;
	Behaviour?: CallableFunction;
  }

  interface MappedDataObject_1 extends SerializableElement_1<DataObject> {
	references: Array<{ id: string; type: string; behaviour: DataObjectReference }>;
  }

  type MappedDataStore_1 = SerializableElement_1<DataStore | DataStoreReference> & {
	references?: Array<{ id: string; type: string; behaviour: DataStoreReference }>;
  };

  interface MappedParticipant_1 {
	id: string;
	type: string;
	name?: string;
	processId?: string;
	parent: Parent_1;
  }

  interface MappedSequenceFlow_1 extends SerializableElement_1<SequenceFlow> {
	sourceId: string;
	targetId: string;
	isDefault?: boolean;
  }

  interface MappedAssociation_1 extends SerializableElement_1<Association> {
	sourceId: string;
	targetId: string;
  }

  interface MessageFlowEndpoint {
	processId?: string;
	participantId?: string;
	participantName?: string;
	id?: string;
  }

  interface MappedMessageFlow_1 extends SerializableElement_1<MessageFlow> {
	sourceId?: string;
	targetId?: string;
	source: MessageFlowEndpoint;
	target: MessageFlowEndpoint;
  }

  interface MappedEventDefinition {
	id?: string;
	type: string;
	behaviour: Record<string, any>;
  }

  interface MappedLoopCharacteristics {
	id?: string;
	type: string;
	behaviour: Record<string, any>;
  }

  interface MappedProperty {
	id?: string;
	type: string;
	behaviour: Record<string, any>;
  }

  interface MappedDataAssociation {
	id?: string;
	type: string;
	behaviour: Record<string, any>;
  }

  interface MappedLane {
	id?: string;
	type: string;
	behaviour: Record<string, any>;
  }

  interface MappedIoSpecification {
	id?: string;
	type: string;
	behaviour: {
	  dataInputs?: Array<{ id: string; type: string; behaviour: Record<string, any> }>;
	  dataOutputs?: Array<{ id: string; type: string; behaviour: Record<string, any> }>;
	};
  }

  interface MappedResource {
	type: string;
	expression?: string;
	behaviour: Record<string, any>;
  }

  interface MappedMessageRef {
	id: string;
	type: string;
	name?: string;
  }

  type MappedBehaviour_1<T extends object = {}> = Omit<
	T,
	| 'eventDefinitions'
	| 'loopCharacteristics'
	| 'ioSpecification'
	| 'properties'
	| 'laneSets'
	| 'lanes'
	| 'resources'
	| 'dataInputAssociations'
	| 'dataOutputAssociations'
	| 'messageRef'
  > & {
	eventDefinitions?: MappedEventDefinition[];
	loopCharacteristics?: MappedLoopCharacteristics;
	ioSpecification?: MappedIoSpecification;
	properties?: { type: 'properties'; values: MappedProperty[] };
	lanes?: MappedLane[];
	resources?: MappedResource[];
	dataInputAssociations?: MappedDataAssociation[];
	dataOutputAssociations?: MappedDataAssociation[];
	messageRef?: MappedMessageRef;
  };

  interface MappedActivityBehaviour extends MappedBehaviour_1<FlowNode> {
	attachedTo?: { id: string; type: string; name?: string };
	scriptFormat?: string;
	script?: string;
	isForCompensation?: boolean;
	default?: any;
	conditionExpression?: Record<string, any>;
	[key: string]: any;
  }

  type MappedActivity_1 = SerializableElement_1<MappedActivityBehaviour>;

  type MappedProcess_1 = SerializableElement_1<MappedBehaviour_1<ModdleProcess>>;

  interface MappedContext_1 {
	scripts: Script_1[];
	timers: Timer_1[];
	activities: MappedActivity_1[];
	associations: MappedAssociation_1[];
	dataObjects: MappedDataObject_1[];
	dataStores: MappedDataStore_1[];
	messageFlows: MappedMessageFlow_1[];
	participants: MappedParticipant_1[];
	processes: MappedProcess_1[];
	sequenceFlows: MappedSequenceFlow_1[];
	definition: Definition_1;
  }

  interface ExtendContext {
	scripts: Script_1[];
	timers: Timer_1[];
	addScript(scriptName: string, elm: ScriptElement): void;
	addTimer(timerName: string, elm: TimerElement): void;
  }

  type ResolverFn_1 = (entity: any) => any;

  type ExtendFn_1 = (elementBehaviour: BaseElement, context: ExtendContext) => Record<string, any> | undefined | void;

  type TypeResolverExtender = (typeMapping: Record<string, any>) => void;

	export {};
}

//# sourceMappingURL=index.d.ts.map