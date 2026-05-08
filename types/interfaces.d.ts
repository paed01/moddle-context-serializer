import type {
  Association,
  BaseElement,
  BPMNModel,
  DataObject,
  DataObjectReference,
  DataStore,
  DataStoreReference,
  Definitions as ModdleDefinitions,
  FlowNode,
  Lane,
  MessageFlow,
  Participant as ModdleParticipant,
  Process as ModdleProcess,
  SequenceFlow,
} from 'bpmn-moddle';

export type { BPMNModel };

export interface Parent {
  id?: string;
  type?: string;
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

export interface SerializableElement<TBehaviour = Record<string, any>> {
  id?: string;
  type?: string;
  parent?: Parent;
  behaviour: TBehaviour;
  Behaviour?: CallableFunction;
  [key: string]: any;
}

export interface Definition extends Pick<ModdleDefinitions, 'id' | 'name' | 'targetNamespace'> {
  type: string;
  exporter: string;
  exporterVersion: string;
  Behaviour?: CallableFunction;
}

export interface MappedDataObject extends SerializableElement<DataObject> {
  references: Array<{ id: string; type: string; behaviour: DataObjectReference }>;
}

export type MappedDataStore = SerializableElement<DataStore | DataStoreReference> & {
  references?: Array<{ id: string; type: string; behaviour: DataStoreReference }>;
};

export interface MappedParticipant {
  id: string;
  type: string;
  name?: string;
  processId?: string;
  parent: Parent;
}

export interface MappedSequenceFlow extends SerializableElement<SequenceFlow> {
  sourceId: string;
  targetId: string;
  isDefault?: boolean;
}

export interface MappedAssociation extends SerializableElement<Association> {
  sourceId: string;
  targetId: string;
}

export interface MessageFlowEndpoint {
  processId?: string;
  participantId?: string;
  participantName?: string;
  id?: string;
}

export interface MappedMessageFlow extends SerializableElement<MessageFlow> {
  sourceId?: string;
  targetId?: string;
  source: MessageFlowEndpoint;
  target: MessageFlowEndpoint;
}

export interface MappedEventDefinition {
  id?: string;
  type: string;
  behaviour: Record<string, any>;
}

export interface MappedLoopCharacteristics {
  id?: string;
  type: string;
  behaviour: Record<string, any>;
}

export interface MappedProperty {
  id?: string;
  type: string;
  behaviour: Record<string, any>;
}

export interface MappedDataAssociation {
  id?: string;
  type: string;
  behaviour: Record<string, any>;
}

export interface MappedLane {
  id?: string;
  type: string;
  behaviour: Record<string, any>;
}

export interface MappedIoSpecification {
  id?: string;
  type: string;
  behaviour: {
    dataInputs?: Array<{ id: string; type: string; behaviour: Record<string, any> }>;
    dataOutputs?: Array<{ id: string; type: string; behaviour: Record<string, any> }>;
  };
}

export interface MappedResource {
  type: string;
  expression?: string;
  behaviour: Record<string, any>;
}

export interface MappedMessageRef {
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

export interface MappedActivityBehaviour extends MappedBehaviour<FlowNode> {
  attachedTo?: { id: string; type: string; name?: string };
  scriptFormat?: string;
  script?: string;
  isForCompensation?: boolean;
  default?: any;
  conditionExpression?: Record<string, any>;
  [key: string]: any;
}

export type MappedActivity = SerializableElement<MappedActivityBehaviour>;

export type MappedProcess = SerializableElement<MappedBehaviour<ModdleProcess>>;

export interface MappedContext {
  scripts: Script[];
  timers: Timer[];
  activities: MappedActivity[];
  associations: MappedAssociation[];
  dataObjects: MappedDataObject[];
  dataStores: MappedDataStore[];
  messageFlows: MappedMessageFlow[];
  participants: MappedParticipant[];
  processes: MappedProcess[];
  sequenceFlows: MappedSequenceFlow[];
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

export interface ModdleReference {
  id: string;
  property: string;
  element: BaseElement;
}

export interface References {
  dataInputAssociations: ModdleReference[];
  dataObjectRefs: ModdleReference[];
  dataOutputAssociations: ModdleReference[];
  dataStoreRefs: ModdleReference[];
  flowNodeRefs: Map<string, Lane>;
  flowRefs: Map<string, FlowRef>;
  processRefs: Map<string, { id: string; $type: string }>;
}
