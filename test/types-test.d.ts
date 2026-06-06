import type {
  Serializer,
  TypeResolver,
  Participant,
  Parent,
  SerializableElement,
  MappedBehaviour,
  LoopCharacteristics,
  LoopCharacteristicsBehaviour,
  MessageRef,
  ResolverFn,
  ExtendFn,
} from 'moddle-context-serializer';

type _MappedContext = ReturnType<typeof Serializer>['elements'];
type _MappedActivity = ReturnType<ReturnType<typeof Serializer>['getActivities']>[number];
type _MappedProcess = ReturnType<ReturnType<typeof Serializer>['getProcesses']>[number];
type _MappedSequenceFlow = ReturnType<ReturnType<typeof Serializer>['getSequenceFlows']>[number];
type _MappedAssociation = ReturnType<ReturnType<typeof Serializer>['getAssociations']>[number];
type _MappedMessageFlow = ReturnType<ReturnType<typeof Serializer>['getMessageFlows']>[number];
type _MappedDataObject = ReturnType<ReturnType<typeof Serializer>['getDataObjects']>[number];
type _MappedDataStore = ReturnType<ReturnType<typeof Serializer>['getDataStoreReferences']>[number];
type _Script = ReturnType<ReturnType<typeof Serializer>['getScripts']>[number];
type _Timer = ReturnType<ReturnType<typeof Serializer>['getTimers']>[number];
type _Definition = ReturnType<typeof Serializer>['elements']['definition'];

declare const _participant: Participant;
declare const _parent: Parent;
declare const _serializableElement: SerializableElement;
declare const _mappedBehaviour: MappedBehaviour;
declare const _resolverFn: ResolverFn;
declare const _extendFn: ExtendFn;
declare const _typeResolver: typeof TypeResolver;

declare const _loopCharacteristics: LoopCharacteristics;
declare const _loopCharacteristicsBehaviour: LoopCharacteristicsBehaviour;

type _LoopCardinality = LoopCharacteristicsBehaviour['loopCardinality'];
type _LoopCompletion = LoopCharacteristicsBehaviour['completionCondition'];
type _LoopCondition = LoopCharacteristicsBehaviour['loopCondition'];
type _LoopMaximum = LoopCharacteristicsBehaviour['loopMaximum'];
type _LoopDataInputRef = LoopCharacteristicsBehaviour['loopDataInputRef'];
type _LoopDataOutputRef = LoopCharacteristicsBehaviour['loopDataOutputRef'];
type _OneBehaviorEventRef = LoopCharacteristicsBehaviour['oneBehaviorEventRef'];
type _NoneBehaviorEventRef = LoopCharacteristicsBehaviour['noneBehaviorEventRef'];
type _ActivityLoop = MappedBehaviour['loopCharacteristics'];

type _AssertString<T extends string | undefined> = T;
type _AssertNumber<T extends number | undefined> = T;
type _AssertMessageRef<T extends MessageRef | undefined> = T;
type _AssertLoopOrUndefined<T extends LoopCharacteristics | undefined> = T;

type _CheckLoopCardinality = _AssertString<_LoopCardinality>;
type _CheckLoopCompletion = _AssertString<_LoopCompletion>;
type _CheckLoopCondition = _AssertString<_LoopCondition>;
type _CheckLoopMaximum = _AssertNumber<_LoopMaximum>;
type _CheckLoopDataInputRef = _AssertMessageRef<_LoopDataInputRef>;
type _CheckLoopDataOutputRef = _AssertMessageRef<_LoopDataOutputRef>;
type _CheckOneBehaviorEventRef = _AssertMessageRef<_OneBehaviorEventRef>;
type _CheckNoneBehaviorEventRef = _AssertMessageRef<_NoneBehaviorEventRef>;
type _CheckActivityLoop = _AssertLoopOrUndefined<_ActivityLoop>;

export type {
  _MappedContext,
  _MappedActivity,
  _MappedProcess,
  _MappedSequenceFlow,
  _MappedAssociation,
  _MappedMessageFlow,
  _MappedDataObject,
  _MappedDataStore,
  _Script,
  _Timer,
  _Definition,
};
