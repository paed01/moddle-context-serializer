/// <reference types="bpmn-moddle" />

declare module 'moddle-context-serializer' {
  import { Definitions, BaseElement } from 'bpmn-moddle';

  type resolver = (entity: any) => void;
  type extendFn = (elementBehaviour: BaseElement, context: ExtendContext) => Record<string, any> | undefined | void;

  export interface SerializableElement {
    id?: string;
    type?: string;
    parent?: Parent;
    behaviour: Record<string, any>;
    Behaviour?: CallableFunction;
    [key: string]: any;
  }

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
    definition: {
      id: string;
      type: string;
      name: string;
      targetNamespace: string;
      exporter: string;
      exporterVersion: string;
    };
  }

  export interface SerializableContext {
    id: string;
    type: string;
    name: string;
    elements: SerializableElement[];
    serialize(): string;
    getProcessById(processId: string): SerializableElement;
    getProcesses(): SerializableElement[];
    getExecutableProcesses(): SerializableElement[];
    getInboundSequenceFlows(activityId: string): SerializableElement;
    getOutboundSequenceFlows(activityId: string): SerializableElement;
    getMessageFlows(scopeId?: string): SerializableElement;
    getSequenceFlows(scopeId?: string): SerializableElement;
    getSequenceFlowById(flowId: string): SerializableElement | undefined;
    getActivities(scopeId?: string): SerializableElement[];
    getDataObjects(scopeId?: string): any[];
    getDataStoreReferences(scopeId?: string): any[];
    getDataObjectById(dataObjectId: string): any[];
    getDataStoreReferenceById(dataStoreId: any): any;
    getDataStores(): any[];
    getDataStoreById(dataStoreId: string): any;
    getActivityById(activityId: string): SerializableElement;
    getAssociations(scopeId?: string): SerializableElement;
    getAssociationById(associationId: string): SerializableElement | undefined;
    getExtendContext(): ExtendContext;
    getInboundAssociations(activityId: string): SerializableElement[];
    getOutboundAssociations(activityId: string): SerializableElement[];
    getScripts(elementType?: string): Script[];
    getScriptsByElementId(elementId: string): Script[];
    getTimers(elementType?: string): Timer[];
    getTimersByElementId(elementId: string): Timer[];
  }

  interface ExtendContext {
    scripts: Script[];
    timers: Timer[];
    addScript(scriptName: string, elm: ScriptElement): void;
    addTimer(timerName: string, elm: TimerElement): void;
  }

  export function TypeResolver(types: Record<string, any>, extender?: (typeMapping: Record<string, any>) => void): resolver;
  export function resolveTypes(mappedContext: MappedContext, typeResolver: typeof TypeResolver): MappedContext;
  export function deserialize(deserializedContext: object, typeResolver: resolver): SerializableContext;
  export function map(moddleContext: Definitions, extendFn: extendFn): MappedContext;
  export default function context(moddleContext: Definitions, typeResolver: resolver, extendFn?: extendFn): SerializableContext;
}
