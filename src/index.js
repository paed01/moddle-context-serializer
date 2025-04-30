const refKeyPattern = /^(?!\$).+?Ref$/;

export default Serializer;

export function TypeResolver(types, extender) {
  const { BpmnError, Definition, Dummy, ServiceImplementation } = types;

  const typeMapper = {};

  typeMapper['bpmn:DataObjectReference'] = Dummy;
  typeMapper['bpmn:Definitions'] = Definition;
  typeMapper['bpmn:Error'] = BpmnError;

  if (extender) extender(typeMapper);

  return function resolve(entity) {
    const { type, behaviour } = entity;

    entity.Behaviour = getBehaviourFromType(typeMapper, types, type);
    if (!behaviour) return;

    if (behaviour.implementation) {
      behaviour.Service = ServiceImplementation;
    }

    if (behaviour.loopCharacteristics) {
      resolve(behaviour.loopCharacteristics);
    }

    if (behaviour.eventDefinitions) {
      for (const ed of behaviour.eventDefinitions) {
        resolve(ed);
      }
    }

    if (behaviour.lanes) {
      for (const lane of behaviour.lanes) {
        resolve(lane);
      }
    }

    if (behaviour.ioSpecification) {
      resolve(behaviour.ioSpecification);
    }

    if (behaviour.properties) {
      behaviour.properties.Behaviour = types.Properties;
    }
  };
}

function getBehaviourFromType(typeMapper, types, type) {
  let activityType = typeMapper[type];
  if (!activityType && type) {
    const nonPrefixedType = type.split(':').slice(1).join(':');
    activityType = types[nonPrefixedType];
  }

  if (!activityType) {
    throw new Error(`Unknown activity type ${type}`);
  }

  return activityType;
}

export function map(moddleContext, extendFn) {
  return new Mapper(moddleContext, extendFn).map();
}

export function Serializer(moddleContext, typeResolver, extendFn) {
  const mapped = new Mapper(moddleContext, extendFn).map();
  return new ContextApi(resolveTypes(mapped, typeResolver));
}

export function deserialize(deserializedContext, typeResolver) {
  return new ContextApi(resolveTypes(deserializedContext, typeResolver));
}

function ContextApi(elements) {
  const definition = elements.definition;
  this.id = definition.id;
  this.type = definition.type;
  this.name = definition.name;

  elements.dataStores = elements.dataStores || [];
  elements.scripts = elements.scripts || [];
  elements.timers = elements.timers || [];

  this.elements = elements;
}

ContextApi.prototype.serialize = function serialize() {
  const elements = this.elements;
  return JSON.stringify({
    id: elements.definition.id,
    type: elements.definition.type,
    name: elements.definition.name,
    ...elements,
  });
};

ContextApi.prototype.getProcessById = function getProcessById(processId) {
  return this.elements.processes.find(({ id }) => id === processId);
};

ContextApi.prototype.getProcesses = function getProcesses() {
  return this.elements.processes;
};

ContextApi.prototype.getExecutableProcesses = function getExecutableProcesses() {
  return this.elements.processes.filter((p) => p.behaviour.isExecutable);
};

ContextApi.prototype.getInboundSequenceFlows = function getInboundSequenceFlows(activityId) {
  return this.elements.sequenceFlows.filter((flow) => flow.targetId === activityId);
};

ContextApi.prototype.getOutboundSequenceFlows = function getOutboundSequenceFlows(activityId) {
  return this.elements.sequenceFlows.filter((flow) => flow.sourceId === activityId);
};

ContextApi.prototype.getMessageFlows = function getMessageFlows(scopeId) {
  const messageFlows = this.elements.messageFlows;
  if (scopeId) return messageFlows.filter((flow) => flow.source.processId === scopeId);
  return messageFlows;
};

ContextApi.prototype.getSequenceFlows = function getSequenceFlows(scopeId) {
  const sequenceFlows = this.elements.sequenceFlows;
  if (scopeId) return sequenceFlows.filter((flow) => flow.parent.id === scopeId);
  return sequenceFlows;
};

ContextApi.prototype.getSequenceFlowById = function getSequenceFlowById(flowId) {
  return this.elements.sequenceFlows.find(({ id }) => id === flowId);
};

ContextApi.prototype.getActivities = function getActivities(scopeId) {
  const activities = this.elements.activities;
  if (!scopeId) return activities;
  return activities.filter((activity) => activity.parent.id === scopeId);
};

ContextApi.prototype.getDataObjects = function getDataObjects(scopeId) {
  if (!scopeId) return this.elements.dataObjects;
  return this.elements.dataObjects.filter((elm) => elm.parent.id === scopeId);
};

ContextApi.prototype.getDataStoreReferences = function getDataStoreReferences(scopeId) {
  if (!scopeId) return this.elements.dataStores;
  return this.elements.dataStores.filter((elm) => elm.parent.id === scopeId);
};

ContextApi.prototype.getDataObjectById = function getDataObjectById(dataObjectId) {
  return this.elements.dataObjects.find(({ id }) => id === dataObjectId);
};

ContextApi.prototype.getDataStoreReferenceById = function getDataStoreReferenceById(dataStoreId) {
  return this.elements.dataStores.find(({ id }) => id === dataStoreId);
};

ContextApi.prototype.getDataStores = function getDataStores() {
  return this.elements.dataStores.filter(({ type }) => type === 'bpmn:DataStore');
};

ContextApi.prototype.getDataStoreById = function getDataStoreById(dataStoreId) {
  return this.elements.dataStores.find(({ id, type }) => id === dataStoreId && type === 'bpmn:DataStore');
};

ContextApi.prototype.getActivityById = function getActivityById(activityId) {
  return this.elements.activities.find((activity) => activity.id === activityId);
};

ContextApi.prototype.getAssociations = function getAssociations(scopeId) {
  const associations = this.elements.associations;
  if (scopeId) return associations.filter((flow) => flow.parent.id === scopeId);
  return associations;
};

ContextApi.prototype.getAssociationById = function getAssociationById(associationId) {
  return this.elements.associations.find((association) => association.id === associationId);
};

ContextApi.prototype.getExtendContext = function getExtendContext() {
  return new ExtendContext({ scripts: this.elements.scripts, timers: this.elements.timers });
};

ContextApi.prototype.getInboundAssociations = function getInboundAssociations(activityId) {
  return this.elements.associations.filter((flow) => flow.targetId === activityId);
};

ContextApi.prototype.getOutboundAssociations = function getOutboundAssociations(activityId) {
  return this.elements.associations.filter((flow) => flow.sourceId === activityId);
};

ContextApi.prototype.getScripts = function getScripts(elementType) {
  const scripts = this.elements.scripts;
  if (!elementType) return scripts.slice();
  return scripts.filter(({ parent }) => parent.type === elementType);
};

ContextApi.prototype.getScriptsByElementId = function getScriptsByElementId(elementId) {
  return this.elements.scripts.filter(({ parent }) => parent.id === elementId);
};

ContextApi.prototype.getTimers = function getTimers(elementType) {
  const timers = this.elements.timers;
  if (!elementType) return timers.slice();
  return timers.filter(({ parent }) => parent.type === elementType);
};

ContextApi.prototype.getTimersByElementId = function getTimersByElementId(elementId) {
  return this.elements.timers.filter(({ parent }) => parent.id === elementId);
};

export function resolveTypes(mappedContext, typeResolver) {
  const { activities, associations, dataObjects, dataStores = [], definition, messageFlows, processes, sequenceFlows } = mappedContext;

  definition.Behaviour = typeResolver(definition);
  processes.forEach(typeResolver);
  activities.forEach(typeResolver);
  dataObjects.forEach(typeResolver);
  dataStores.forEach(typeResolver);
  messageFlows.forEach(typeResolver);
  sequenceFlows.forEach(typeResolver);
  associations.forEach(typeResolver);

  return mappedContext;
}

function Mapper(moddleContext, extendFn) {
  this.moddleContext = moddleContext;
  this._extendFn = extendFn;
  this.scripts = [];
  this.timers = [];
}

Mapper.prototype.map = function MapperConstructor() {
  const moddleContext = this.moddleContext;
  const rootElement = (this._root = moddleContext.rootElement ? moddleContext.rootElement : moddleContext.rootHandler.element);
  const definition = {
    id: rootElement.id,
    type: rootElement.$type,
    name: rootElement.name,
    targetNamespace: rootElement.targetNamespace,
    exporter: rootElement.exporter,
    exporterVersion: rootElement.exporterVersion,
  };

  this._references = this._prepareReferences();

  const elements = this._prepareElements(definition, rootElement.rootElements);

  return {
    definition,
    ...elements,
    scripts: this.scripts,
    timers: this.timers,
  };
};

Mapper.prototype._prepareReferences = function prepareReferences() {
  const result = {
    dataInputAssociations: [],
    dataObjectRefs: [],
    dataOutputAssociations: [],
    dataStoreRefs: [],
    flowNodeRefs: new Map(),
    flowRefs: new Map(),
    processRefs: new Map(),
  };

  const { references, elementsById } = this.moddleContext;

  for (const r of references) {
    const { property, element } = r;
    switch (property) {
      case 'bpmn:sourceRef': {
        this._upsertFlowRef(result.flowRefs, element.id, {
          id: element.id,
          $type: element.$type,
          sourceId: r.id,
          element: elementsById[element.id],
        });
        break;
      }
      case 'bpmn:targetRef': {
        this._upsertFlowRef(result.flowRefs, element.id, {
          targetId: r.id,
        });
        break;
      }
      case 'bpmn:default':
        this._upsertFlowRef(result.flowRefs, r.id, { isDefault: true });
        break;
      case 'bpmn:dataStoreRef':
        result.dataStoreRefs.push(r);
        break;
      case 'bpmn:dataObjectRef':
        result.dataObjectRefs.push(r);
        break;
      case 'bpmn:processRef': {
        result.processRefs.set(element.id, {
          id: r.id,
          $type: element.$type,
        });
        break;
      }
      case 'bpmn:flowNodeRef':
        result.flowNodeRefs.set(r.id, { ...element });
        break;
    }

    switch (element.$type) {
      case 'bpmn:DataInputAssociation':
        result.dataInputAssociations.push(r);
        break;
      case 'bpmn:DataOutputAssociation':
        result.dataOutputAssociations.push(r);
        break;
    }
  }

  return result;
};

/**
 * Upsert flow ref
 * @param {Map<string, any>} target
 * @param {string} id element id
 * @param {any} value flow node element ref
 */
Mapper.prototype._upsertFlowRef = function upsertFlowRef(target, id, value) {
  if (!target.has(id)) {
    target.set(id, value);
  } else {
    Object.assign(target.get(id), value);
  }
};

Mapper.prototype._prepareElements = function prepareElements(parent, elements) {
  const result = {
    activities: [],
    associations: [],
    dataObjects: [],
    dataStores: [],
    messageFlows: [],
    participants: [],
    processes: [],
    sequenceFlows: [],
  };

  if (!elements) return result;

  const references = this._references;

  for (const element of elements) {
    const { id, $type: type, name } = element;

    switch (type) {
      case 'bpmn:DataObjectReference':
        break;
      case 'bpmn:Collaboration': {
        if (element.messageFlows) {
          const { messageFlows: flows } = this._prepareElements(parent, element.messageFlows);
          result.messageFlows = result.messageFlows.concat(flows);
        }
        if (element.participants) {
          for (const p of element.participants) {
            const processRef = references.processRefs.get(p.id);
            result.participants.push({
              id: p.id,
              type: p.$type,
              name: p.name,
              processId: processRef && processRef.id,
              parent: {
                id,
                type,
              },
            });
          }
        }
        break;
      }
      case 'bpmn:DataObject': {
        result.dataObjects.push({
          id,
          name,
          type,
          parent: {
            id: parent.id,
            type: parent.type,
          },
          references: this._prepareDataObjectReferences(element),
          behaviour: this._prepareElementBehaviour(element),
        });
        break;
      }
      case 'bpmn:DataStore': {
        result.dataStores.push({
          id,
          name,
          type,
          parent: {
            id: parent.id,
            type: parent.type,
          },
          references: this._prepareDataStoreReferences(element),
          behaviour: this._prepareElementBehaviour(element),
        });
        break;
      }
      case 'bpmn:DataStoreReference': {
        result.dataStores.push({
          id,
          name,
          type,
          parent: {
            id: parent.id,
            type: parent.type,
          },
          behaviour: this._prepareElementBehaviour(element),
        });
        break;
      }
      case 'bpmn:MessageFlow': {
        const flowRef = references.flowRefs.get(element.id);
        result.messageFlows.push({
          ...flowRef,
          id,
          type,
          name,
          parent: {
            id: parent.id,
            type: parent.type,
          },
          ...this._getMessageFlowSourceAndTarget(flowRef),
          behaviour: this._prepareElementBehaviour(element),
        });
        break;
      }
      case 'bpmn:Association': {
        const flowRef = references.flowRefs.get(element.id);
        result.associations.push({
          id,
          name,
          type,
          parent: {
            id: parent.id,
            type: parent.type,
          },
          targetId: flowRef.targetId,
          sourceId: flowRef.sourceId,
          behaviour: this._prepareElementBehaviour(element),
        });
        break;
      }
      case 'bpmn:SequenceFlow': {
        const flowRef = references.flowRefs.get(element.id);

        result.sequenceFlows.push({
          id,
          name,
          type,
          parent: {
            id: parent.id,
            type: parent.type,
          },
          isDefault: flowRef.isDefault,
          targetId: flowRef.targetId,
          sourceId: flowRef.sourceId,
          behaviour: this._prepareElementBehaviour(element),
        });
        break;
      }
      case 'bpmn:AdHocSubProcess':
      case 'bpmn:SubProcess':
      case 'bpmn:Transaction':
      case 'bpmn:Process': {
        const bp = this._prepareActivity(element, parent, element);
        if (type === 'bpmn:Process') result.processes.push(bp);
        else result.activities.push(bp);

        for (const subElements of [this._prepareElements(bp, element.flowElements), this._prepareElements(bp, element.artifacts)]) {
          result.activities = result.activities.concat(subElements.activities);
          result.sequenceFlows = result.sequenceFlows.concat(subElements.sequenceFlows);
          result.dataObjects = result.dataObjects.concat(subElements.dataObjects);
          result.dataStores = result.dataStores.concat(subElements.dataStores);
          result.associations = result.associations.concat(subElements.associations);
        }

        break;
      }
      case 'bpmn:BoundaryEvent': {
        const attachedTo = element.attachedToRef && spreadRef(element.attachedToRef);
        result.activities.push(this._prepareActivity(element, parent, { attachedTo }));
        break;
      }
      case 'bpmn:ScriptTask': {
        const { scriptFormat, script, resource } = element;
        new ExtendContext({ scripts: this.scripts }).addScript(element.id, {
          parent: {
            id,
            type,
          },
          scriptFormat,
          ...(script && { body: script }),
          ...(resource && { resource }),
          type: 'bpmn:Script',
        });
        result.activities.push(this._prepareActivity(element, parent));
        break;
      }
      default: {
        result.activities.push(this._prepareActivity(element, parent));
      }
    }
  }

  return result;
};

Mapper.prototype._prepareActivity = function prepareActivity(element, parent, behaviour) {
  const { id, $type: type, name } = element;
  const lane = this._references.flowNodeRefs.get(id);

  return {
    id,
    type,
    name,
    parent: {
      id: parent.id,
      type: parent.type,
    },
    ...(lane && { lane: { ...lane } }),
    behaviour: this._prepareElementBehaviour(element, behaviour),
  };
};

Mapper.prototype._prepareElementBehaviour = function prepareElementBehaviour(element, behaviour) {
  const { id, $type: type, eventDefinitions, loopCharacteristics, ioSpecification, conditionExpression, properties } = element;

  const preparedElement = {
    ...behaviour,
    ...element,
    ...(eventDefinitions && { eventDefinitions }),
  };

  const extendContext = new ExtendContext({
    scripts: this.scripts,
    timers: this.timers,
    parent: {
      id,
      type,
    },
  });

  if (eventDefinitions) {
    const definitions = (preparedElement.eventDefinitions = []);
    for (const ed of eventDefinitions) {
      const edBehaviour = this._mapActivityBehaviour(ed, extendContext);
      if (edBehaviour) definitions.push(edBehaviour);
    }
  }

  if (loopCharacteristics) {
    preparedElement.loopCharacteristics = this._mapActivityBehaviour(loopCharacteristics, extendContext);
  }

  if (properties) {
    const props = (preparedElement.properties = { type: 'properties', values: [] });
    for (const prop of properties) {
      props.values.push(this._mapActivityBehaviour(prop, extendContext));
    }
  }

  if (ioSpecification) {
    preparedElement.ioSpecification = this._mapActivityBehaviour(ioSpecification, extendContext);
  }

  if (element.dataInputAssociations) {
    const associations = (preparedElement.dataInputAssociations = []);
    for (const association of element.dataInputAssociations) {
      associations.push(this._mapActivityBehaviour(association, extendContext));
    }
  }
  if (element.dataOutputAssociations) {
    const associations = (preparedElement.dataOutputAssociations = []);
    for (const association of element.dataOutputAssociations) {
      associations.push(this._mapActivityBehaviour(association, extendContext));
    }
  }

  if (conditionExpression && conditionExpression.language) {
    const { $type: exprType, language: scriptFormat, ...rest } = conditionExpression;
    extendContext.addScript(id, {
      type: exprType,
      scriptFormat,
      ...rest,
    });
  }

  if (element.laneSets) {
    const lanes = (preparedElement.lanes = []);
    for (const laneSet of element.laneSets) {
      for (const lane of laneSet.lanes) {
        lanes.push(this._mapActivityBehaviour(lane, extendContext));
      }
    }
  }

  if (element.resources) {
    const resources = (preparedElement.resources = []);
    for (const resource of element.resources) {
      const { $type, resourceAssignmentExpression } = resource;

      resources.push({
        type: $type,
        expression: resourceAssignmentExpression.expression && resourceAssignmentExpression.expression.body,
        behaviour: { ...resource },
      });
    }
  }

  if (element.messageRef) {
    preparedElement.messageRef = spreadRef(element.messageRef);
  }

  const extendFn = this._extendFn;
  if (!extendFn) return preparedElement;
  const mod = extendFn(preparedElement, extendContext);
  return {
    ...mod,
    ...preparedElement,
  };
};

Mapper.prototype._mapActivityBehaviour = function mapActivityBehaviour(ed, extendContext) {
  if (!ed) return;
  const { $type: type, id } = ed;
  let behaviour = { ...ed };

  const keys = Object.getOwnPropertyNames(ed);
  for (const key of keys) {
    if (refKeyPattern.test(key)) behaviour[key] = spreadRef(ed[key]);
  }

  switch (type) {
    case 'bpmn:ConditionalEventDefinition': {
      if (behaviour.condition?.language) {
        const { language, body, resource } = behaviour.condition;
        extendContext.addScript(id || type, {
          scriptFormat: language,
          ...behaviour.condition,
        });
        behaviour.script = { language, ...(body && { body }), ...(resource && { resource }) };
      } else {
        behaviour.expression = behaviour.condition && behaviour.condition.body;
      }
      break;
    }
    case 'bpmn:InputOutputSpecification': {
      behaviour = this._prepareIoSpecificationBehaviour(ed);
      break;
    }
    case 'bpmn:Property': {
      behaviour = this._preparePropertyBehaviour(ed);
      break;
    }
    case 'bpmn:MultiInstanceLoopCharacteristics': {
      behaviour.loopCardinality = ed.loopCardinality && ed.loopCardinality.body;
      behaviour.completionCondition = ed.completionCondition && ed.completionCondition.body;
      break;
    }
    case 'bpmn:StandardLoopCharacteristics': {
      behaviour.loopCondition = ed.loopCondition && ed.loopCondition.body;
      break;
    }
    case 'bpmn:TimerEventDefinition': {
      for (const timerType of ['timeCycle', 'timeDuration', 'timeDate']) {
        if (timerType in behaviour && behaviour[timerType].body) {
          const value = (behaviour[timerType] = behaviour[timerType].body);
          extendContext.addTimer(id || timerType, {
            id,
            type,
            timerType,
            value,
          });
        }
      }
      break;
    }
    case 'bpmn:DataOutputAssociation':
    case 'bpmn:DataInputAssociation': {
      if (Array.isArray(ed.sourceRef) && ed.sourceRef.length) {
        behaviour.sourceRef = spreadRef(ed.sourceRef[0]);
      }
      break;
    }
  }

  return {
    id,
    type,
    behaviour,
  };
};

Mapper.prototype._preparePropertyBehaviour = function preparePropertyBehaviour(propertyDef) {
  const dataInput = this._getDataInputBehaviour(propertyDef.id);
  const dataOutput = this._getDataOutputBehaviour(propertyDef.id);

  return {
    ...propertyDef,
    ...(dataInput.association.source && { dataInput }),
    ...(dataOutput.association.target && { dataOutput }),
  };
};

Mapper.prototype._prepareIoSpecificationBehaviour = function prepareIoSpecificationBehaviour({ dataInputs, dataOutputs }) {
  const result = {};

  if (dataInputs) {
    result.dataInputs = [];
    for (const input of dataInputs) {
      result.dataInputs.push({
        ...input,
        type: input.$type,
        behaviour: this._getDataInputBehaviour(input.id),
      });
    }
  }
  if (dataOutputs) {
    result.dataOutputs = [];
    for (const output of dataOutputs) {
      result.dataOutputs.push({
        ...output,
        type: output.$type,
        behaviour: this._getDataOutputBehaviour(output.id),
      });
    }
  }

  return result;
};

Mapper.prototype._prepareDataStoreReferences = function prepareDataStoreReferences(element) {
  const objectRefs = this._references.dataStoreRefs.filter((objectRef) => objectRef.id === element.id);

  return objectRefs.map((objectRef) => {
    return {
      id: objectRef.element.id,
      type: objectRef.element.$type,
      behaviour: { ...objectRef.element },
    };
  });
};

Mapper.prototype._getDataInputBehaviour = function getDataInputBehaviour(dataInputId) {
  const dataInputAssociations = this._references.dataInputAssociations;
  const target = dataInputAssociations.find((assoc) => assoc.property === 'bpmn:targetRef' && assoc.id === dataInputId && assoc.element);
  const source =
    target &&
    dataInputAssociations.find((assoc) => assoc.property === 'bpmn:sourceRef' && assoc.element && assoc.element.id === target.element.id);

  return {
    association: {
      source: source && { ...source, ...this._getDataRef(source.id) },
      target: target && { ...target },
    },
  };
};

Mapper.prototype._getDataOutputBehaviour = function getDataOutputBehaviour(dataOutputId) {
  const dataOutputAssociations = this._references.dataOutputAssociations;
  const source = dataOutputAssociations.find((assoc) => assoc.property === 'bpmn:sourceRef' && assoc.id === dataOutputId && assoc.element);
  const target =
    source &&
    dataOutputAssociations.find((assoc) => assoc.property === 'bpmn:targetRef' && assoc.element && assoc.element.id === source.element.id);

  return {
    association: {
      source: source && { ...source },
      target: target && { ...target, ...this._getDataRef(target.id) },
    },
  };
};

Mapper.prototype._getDataRef = function getDataRef(referenceId) {
  const dataObject = this._getDataObject(referenceId);
  const dataStore = this._getDataStore(referenceId);

  return {
    ...(dataObject && { dataObject }),
    ...(dataStore && { dataStore }),
  };
};

Mapper.prototype._getDataObject = function getDataObject(referenceId) {
  const dataReference = this._references.dataObjectRefs.find((dor) => dor.element && dor.element.id === referenceId);
  if (!dataReference) {
    const dataElm = this.moddleContext.elementsById[referenceId];
    return dataElm && dataElm.$type === 'bpmn:DataObject' && { ...dataElm };
  }

  return { ...this.moddleContext.elementsById[dataReference.id] };
};

Mapper.prototype._getDataStore = function getDataStore(referenceId) {
  const dataReference = this._references.dataStoreRefs.find((dor) => dor.element && dor.element.id === referenceId);
  if (dataReference) return { ...this.moddleContext.elementsById[dataReference.id] };

  const dataElm = this.moddleContext.elementsById[referenceId];
  if (!dataElm) return;
  switch (dataElm.$type) {
    case 'bpmn:DataStore':
    case 'bpmn:DataStoreReference':
      return { ...dataElm };
  }
};

Mapper.prototype._prepareDataObjectReferences = function prepareDataObjectReferences(element) {
  const objectRefs = this._references.dataObjectRefs.filter((objectRef) => objectRef.id === element.id);

  return objectRefs.map((objectRef) => {
    return {
      id: objectRef.element.id,
      type: objectRef.element.$type,
      behaviour: { ...objectRef.element },
    };
  });
};

Mapper.prototype._getMessageFlowSourceAndTarget = function getMessageFlowSourceAndTarget(flowRef) {
  return {
    source: this._getElementRef(flowRef.sourceId),
    target: this._getElementRef(flowRef.targetId),
  };
};

Mapper.prototype._getElementRef = function getElementRef(elementId) {
  const targetElement = this.moddleContext.elementsById[elementId];
  if (!targetElement) return;

  const result = {};

  switch (targetElement.$type) {
    case 'bpmn:Participant': {
      result.processId = this._references.processRefs.get(elementId).id;
      result.participantId = targetElement.id;
      result.participantName = targetElement.name;
      break;
    }
    case 'bpmn:Process': {
      result.processId = targetElement.id;
      break;
    }
    default: {
      const bp = this._root.rootElements.find((e) => e.$type === 'bpmn:Process' && e.flowElements.find((ce) => ce.id === elementId));
      result.processId = bp.id;
      result.id = elementId;
    }
  }

  return result;
};

function ExtendContext({ scripts, timers = [], parent }) {
  this.scripts = scripts;
  this.timers = timers;
  this._parent = parent;
}

ExtendContext.prototype.addScript = function addScript(scriptName, elm) {
  const { id, scriptFormat, body, resource, type, parent } = elm;
  this.scripts.push({
    ...this._prepare(scriptName, parent || this._parent),
    script: {
      ...(id && { id }),
      scriptFormat,
      ...(body && { body }),
      ...(resource && { resource }),
      ...(type && { type }),
    },
  });
};

ExtendContext.prototype.addTimer = function addTimer(timerName, { id, timerType, type, value, parent }) {
  this.timers.push({
    ...this._prepare(timerName, parent || this._parent),
    timer: {
      ...(id && { id }),
      timerType,
      ...(value && { value }),
      ...(type && { type }),
    },
  });
};

ExtendContext.prototype._prepare = function prepare(name, { id, type } = {}) {
  return {
    name,
    ...(id && type && { parent: { id, type } }),
  };
};

function spreadRef({ id, $type: type, name }) {
  return { id, type, name };
}
