import type {
  Association as ModdleAssociation,
  BaseElement as ModdleBaseElement,
  DataObject as ModdleDataObject,
  DataObjectReference as ModdleDataObjectReference,
  DataStore as ModdleDataStore,
  DataStoreReference as ModdleDataStoreReference,
  Definitions as ModdleDefinitions,
  Lane as ModdleLane,
  MessageFlow as ModdleMessageFlow,
  MultiInstanceLoopCharacteristics as ModdleMultiInstanceLoopCharacteristics,
  Participant as ModdleParticipant,
  Process as ModdleProcess,
  SequenceFlow as ModdleSequenceFlow,
  StandardLoopCharacteristics as ModdleStandardLoopCharacteristics,
  EventDefinition as ModdleEventDefinition,
  FlowNode,
} from 'bpmn-moddle';

export interface IElement {
  id?: string;
  type?: string;
  [x: string]: any;
}

export interface SerializableElement<TBehaviour = Record<string, any>> extends IElement {
  name?: string;
  parent?: Parent;
  behaviour: TBehaviour;
  Behaviour?: CallableFunction | NewableFunction;
  [key: string]: any;
}

export interface Parent {
  id?: string;
  type?: string;
  [x: string]: any;
}

// --- Element types ---

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

export interface Definition extends Pick<ModdleDefinitions, 'id' | 'name' | 'targetNamespace'> {
  type: string;
  exporter: string;
  exporterVersion: string;
  Behaviour?: CallableFunction | NewableFunction;
}

export interface DataObject extends SerializableElement<ModdleDataObject> {
  references: Array<{ id: string; type: string; behaviour: ModdleDataObjectReference }>;
}

export type DataStore = SerializableElement<ModdleDataStore | ModdleDataStoreReference> & {
  references?: Array<{ id: string; type: string; behaviour: ModdleDataStoreReference }>;
};

export interface Participant extends Partial<Partial<ModdleParticipant>> {
  id: string;
  type: string;
  name?: string;
  processId?: string;
  parent: Parent;
}

export interface SequenceFlow extends SerializableElement<Partial<ModdleSequenceFlow>> {
  sourceId: string;
  targetId: string;
  isDefault?: boolean;
}

export interface Association extends SerializableElement<Partial<ModdleAssociation>> {
  sourceId: string;
  targetId: string;
}

export interface MessageFlowEndpoint {
  processId?: string;
  participantId?: string;
  participantName?: string;
  id?: string;
}

export interface MessageFlow extends SerializableElement<ModdleMessageFlow> {
  sourceId?: string;
  targetId?: string;
  source: MessageFlowEndpoint;
  target: MessageFlowEndpoint;
}

export interface EventDefinition extends SerializableElement<ModdleEventDefinition> {}

export interface LoopCharacteristicsBehaviour extends Partial<
  Omit<
    ModdleMultiInstanceLoopCharacteristics & ModdleStandardLoopCharacteristics,
    | 'loopCardinality'
    | 'completionCondition'
    | 'loopCondition'
    | 'loopMaximum'
    | 'loopDataInputRef'
    | 'loopDataOutputRef'
    | 'oneBehaviorEventRef'
    | 'noneBehaviorEventRef'
  >
> {
  loopCardinality?: string;
  completionCondition?: string;
  loopCondition?: string;
  loopMaximum?: number;
  loopDataInputRef?: MessageRef;
  loopDataOutputRef?: MessageRef;
  oneBehaviorEventRef?: MessageRef;
  noneBehaviorEventRef?: MessageRef;
}

export type LoopCharacteristics = SerializableElement<LoopCharacteristicsBehaviour>;

export interface IoSpecification extends IElement {
  behaviour: {
    dataInputs?: IElement[];
    dataOutputs?: IElement[];
  };
}

export interface Resource extends IElement {
  expression?: string;
  behaviour: Record<string, any>;
}

export interface MessageRef {
  id: string;
  type: string;
  name?: string;
}

export type MappedBehaviour<T extends object = {}> = Omit<
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
  eventDefinitions?: EventDefinition[];
  loopCharacteristics?: LoopCharacteristics;
  ioSpecification?: IoSpecification;
  properties?: { type: 'properties'; values: IElement[] };
  lanes?: IElement[];
  resources?: Resource[];
  dataInputAssociations?: IElement[];
  dataOutputAssociations?: IElement[];
  messageRef?: MessageRef;
};

export interface ActivityBehaviour extends MappedBehaviour<FlowNode> {
  attachedTo?: { id: string; type: string; name?: string };
  scriptFormat?: string;
  script?: string;
  isForCompensation?: boolean;
  default?: SequenceFlow;
  conditionExpression?: Record<string, any>;
  [key: string]: any;
}

export type Activity = SerializableElement<ActivityBehaviour>;

export type Process = SerializableElement<MappedBehaviour<ModdleProcess>>;

export interface MappedContext {
  scripts: Script[];
  timers: Timer[];
  activities: Activity[];
  associations: Association[];
  dataObjects: DataObject[];
  dataStores: DataStore[];
  messageFlows: MessageFlow[];
  participants: Participant[];
  processes: Process[];
  sequenceFlows: SequenceFlow[];
  definition: Definition;
}

export type ResolverFn = (entity: any) => SerializableElement;

export type ExtendFn = (
  elementBehaviour: ModdleBaseElement,
  context: import('../src/index.js').ExtendContext,
) => Record<string, any> | undefined | void;

export type TypeResolverExtender = (typeMapping: Record<string, any>) => void;

export interface FlowRef {
  id?: string;
  $type?: string;
  sourceId?: string;
  targetId?: string;
  isDefault?: boolean;
  element?: any;
}

export interface ModdleReference {
  id: string;
  property: string;
  element: ModdleBaseElement;
}

export interface References {
  dataInputAssociations: ModdleReference[];
  dataObjectRefs: ModdleReference[];
  dataOutputAssociations: ModdleReference[];
  dataStoreRefs: ModdleReference[];
  flowNodeRefs: Map<string, ModdleLane>;
  flowRefs: Map<string, FlowRef>;
  processRefs: Map<string, { id: string; $type: string }>;
}
