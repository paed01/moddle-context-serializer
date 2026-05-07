declare module 'moddle-context-serializer' {
	import type { BaseElement, BPMNModel } from 'bpmn-moddle';
	/**
	 * Build a default behaviour resolver from a type registry.
	 *
	 * @param types - type-name to behaviour-function map (without `bpmn:` prefix)
	 * @param extender - receives the internal mapper for overrides/additions
	 * */
	export function TypeResolver(types: Record<string, any>, extender?: TypeResolverExtender): ResolverFn;
	/**
	 * Map a moddle context into the normalized {@link import('types').MappedContext} shape
	 * without resolving behaviour types. Useful when you want to introspect or modify the
	 * structure before wiring up behaviours.
	 *
	 * */
	export function map(moddleContext: BPMNModel, extendFn?: ExtendFn): MappedContext;
	/**
	 * Build a serializable, behaviour-mapped context from a `bpmn-moddle` parse result.
	 *
	 * */
	export default function Serializer_1(moddleContext: BPMNModel, typeResolver: ResolverFn, extendFn?: ExtendFn): SerializableContext;
	/**
	 * Hydrate a previously-serialized context (output of {@link SerializableContext.serialize})
	 * back into a queryable, behaviour-mapped context.
	 *
	 * @param deserializedContext - the parsed JSON produced by `serialize()`
	 * */
	export function deserialize(deserializedContext: any, typeResolver: ResolverFn): SerializableContext;

	export function SerializableContext(elements: MappedContext): void;
	export class SerializableContext {
		
		constructor(elements: MappedContext);
		id: string;
		type: string;
		name: string;
		elements: MappedContext;
		
		serialize(): string;
		
		getProcessById(processId: string): SerializableElement | undefined;
		
		getProcesses(): SerializableElement[];
		
		getExecutableProcesses(): SerializableElement[];
		
		getInboundSequenceFlows(activityId: string): SerializableElement[];
		
		getOutboundSequenceFlows(activityId: string): SerializableElement[];
		
		getMessageFlows(scopeId?: string): SerializableElement[];
		
		getSequenceFlows(scopeId?: string): SerializableElement[];
		
		getSequenceFlowById(flowId: string): SerializableElement | undefined;
		
		getActivities(scopeId?: string): SerializableElement[];
		
		getDataObjects(scopeId?: string): any[];
		
		getDataStoreReferences(scopeId?: string): any[];
		
		getDataObjectById(dataObjectId: string): any;
		
		getDataStoreReferenceById(dataStoreId: string): any;
		
		getDataStores(): any[];
		
		getDataStoreById(dataStoreId: string): any;
		
		getActivityById(activityId: string): SerializableElement | undefined;
		
		getAssociations(scopeId?: string): SerializableElement[];
		
		getAssociationById(associationId: string): SerializableElement | undefined;
		
		getExtendContext(): ExtendContext;
		
		getInboundAssociations(activityId: string): SerializableElement[];
		
		getOutboundAssociations(activityId: string): SerializableElement[];
		
		getScripts(elementType?: string): Script[];
		
		getScriptsByElementId(elementId: string): Script[];
		
		getTimers(elementType?: string): Timer[];
		
		getTimersByElementId(elementId: string): Timer[];
	}
	/**
	 * Walk a mapped context and run the resolver against every element that may carry behaviour.
	 * The resolver is expected to mutate each entity by attaching a `Behaviour` property.
	 *
	 * */
	export function resolveTypes(mappedContext: MappedContext, typeResolver: ResolverFn): MappedContext;
  interface Parent {
	id?: string;
	type: string;
	[x: string]: any;
  }

  interface ScriptElement {
	id?: string;
	type?: string;
	scriptFormat?: string;
	body?: string;
	resource?: string;
	parent?: Parent;
	[x: string]: any;
  }

  interface TimerElement {
	id?: string;
	type?: string;
	timerType?: string;
	value?: string;
	parent?: Parent;
	[x: string]: any;
  }

  interface Script {
	name: string;
	parent?: Parent;
	script: ScriptElement;
  }

  interface Timer {
	name: string;
	parent?: Parent;
	timer: TimerElement;
  }

  interface SerializableElement {
	id?: string;
	type?: string;
	parent?: Parent;
	behaviour: Record<string, any>;
	Behaviour?: CallableFunction;
	[key: string]: any;
  }

  interface Definition {
	id: string;
	type: string;
	name: string;
	targetNamespace: string;
	exporter: string;
	exporterVersion: string;
	Behaviour?: CallableFunction;
  }

  interface MappedContext {
	scripts: Script[];
	timers: Timer[];
	activities: SerializableElement[];
	associations: SerializableElement[];
	dataObjects: any[];
	dataStores: any[];
	messageFlows: SerializableElement[];
	participants: any[];
	processes: SerializableElement[];
	sequenceFlows: SerializableElement[];
	definition: Definition;
  }

  interface ExtendContext {
	scripts: Script[];
	timers: Timer[];
	addScript(scriptName: string, elm: ScriptElement): void;
	addTimer(timerName: string, elm: TimerElement): void;
  }

  type ResolverFn = (entity: any) => any;

  type ExtendFn = (elementBehaviour: BaseElement, context: ExtendContext) => Record<string, any> | undefined | void;

  type TypeResolverExtender = (typeMapping: Record<string, any>) => void;

	export {};
}

//# sourceMappingURL=index.d.ts.map