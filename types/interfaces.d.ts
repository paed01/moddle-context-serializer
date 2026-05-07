import type { BaseElement, BPMNModel } from 'bpmn-moddle';

export type { BPMNModel };

export interface Parent {
  id?: string;
  type: string;
  [x: string]: any;
}

export interface ScriptElement {
  id?: string;
  type?: string;
  scriptFormat?: string;
  body?: string;
  resource?: string;
  parent?: Parent;
  [x: string]: any;
}

export interface TimerElement {
  id?: string;
  type?: string;
  timerType?: string;
  value?: string;
  parent?: Parent;
  [x: string]: any;
}

export interface Script {
  name: string;
  parent?: Parent;
  script: ScriptElement;
}

export interface Timer {
  name: string;
  parent?: Parent;
  timer: TimerElement;
}

export interface SerializableElement {
  id?: string;
  type?: string;
  parent?: Parent;
  behaviour: Record<string, any>;
  Behaviour?: CallableFunction;
  [key: string]: any;
}

export interface Definition {
  id: string;
  type: string;
  name: string;
  targetNamespace: string;
  exporter: string;
  exporterVersion: string;
  Behaviour?: CallableFunction;
}

export interface MappedContext {
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

export interface ExtendContext {
  scripts: Script[];
  timers: Timer[];
  addScript(scriptName: string, elm: ScriptElement): void;
  addTimer(timerName: string, elm: TimerElement): void;
}

export type ResolverFn = (entity: any) => any;

export type ExtendFn = (elementBehaviour: BaseElement, context: ExtendContext) => Record<string, any> | undefined | void;

export type TypeResolverExtender = (typeMapping: Record<string, any>) => void;

export interface FlowRef {
  id?: string;
  $type?: string;
  sourceId?: string;
  targetId?: string;
  isDefault?: boolean;
  element?: any;
}

export interface References {
  dataInputAssociations: any[];
  dataObjectRefs: any[];
  dataOutputAssociations: any[];
  dataStoreRefs: any[];
  flowNodeRefs: Map<string, any>;
  flowRefs: Map<string, FlowRef>;
  processRefs: Map<string, { id: string; $type: string }>;
}
