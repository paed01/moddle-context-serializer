// @ts-check

const refKeyPattern = /^(?!\$).+?Ref$/;

export default Serializer;

/**
 * Build a default behaviour resolver from a type registry.
 *
 * @param {Record<string, any>} types - type-name to behaviour-function map (without `bpmn:` prefix)
 * @param {import('types').TypeResolverExtender} [extender] - receives the internal mapper for overrides/additions
 * @returns {import('types').ResolverFn}
 */
export function TypeResolver(types, extender) {
  const { BpmnError, Definition, Dummy, ServiceImplementation } = types;

  /** @type {Record<string, any>} */
  const typeMapper = {};

  typeMapper['bpmn:DataObjectReference'] = Dummy;
  typeMapper['bpmn:Definitions'] = Definition;
  typeMapper['bpmn:Error'] = BpmnError;

  if (extender) extender(typeMapper);

  /** @type {import('types').ResolverFn} */
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

/**
 * @param {Record<string, any>} typeMapper
 * @param {Record<string, any>} types
 * @param {string} type
 * @returns {any}
 */
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

/**
 * Map a moddle context into the normalized {@link import('types').MappedContext} shape
 * without resolving behaviour types. Useful when you want to introspect or modify the
 * structure before wiring up behaviours.
 *
 * @param {import('types').BPMNModel} moddleContext
 * @param {import('types').ExtendFn} [extendFn]
 * @returns {import('types').MappedContext}
 */
export function map(moddleContext, extendFn) {
  return new Mapper(moddleContext, extendFn).map();
}

/**
 * Build a serializable, behaviour-mapped context from a `bpmn-moddle` parse result.
 *
 * @param {import('types').BPMNModel} moddleContext
 * @param {import('types').ResolverFn} typeResolver
 * @param {import('types').ExtendFn} [extendFn]
 * @returns {SerializableContext}
 */
export function Serializer(moddleContext, typeResolver, extendFn) {
  const mapped = new Mapper(moddleContext, extendFn).map();
  return new SerializableContext(resolveTypes(mapped, typeResolver));
}

/**
 * Hydrate a previously-serialized context (output of {@link SerializableContext.serialize})
 * back into a queryable, behaviour-mapped context.
 *
 * @param {any} deserializedContext - the parsed JSON produced by `serialize()`
 * @param {import('types').ResolverFn} typeResolver
 * @returns {SerializableContext}
 */
export function deserialize(deserializedContext, typeResolver) {
  return new SerializableContext(resolveTypes(deserializedContext, typeResolver));
}

/**
 * @param {import('types').MappedContext} elements
 */
export function SerializableContext(elements) {
  const definition = elements.definition;
  this.id = definition.id;
  this.type = definition.type;
  this.name = definition.name;

  elements.dataStores = elements.dataStores || [];
  elements.scripts = elements.scripts || [];
  elements.timers = elements.timers || [];

  this.elements = elements;
}

/** @returns {string} */
SerializableContext.prototype.serialize = function serialize() {
  const elements = this.elements;
  return JSON.stringify({
    id: elements.definition.id,
    type: elements.definition.type,
    name: elements.definition.name,
    ...elements,
  });
};

/**
 * @param {string} processId
 * @returns {import('types').SerializableElement | undefined}
 */
SerializableContext.prototype.getProcessById = function getProcessById(processId) {
  return this.elements.processes.find(({ id }) => id === processId);
};

/** @returns {import('types').SerializableElement[]} */
SerializableContext.prototype.getProcesses = function getProcesses() {
  return this.elements.processes;
};

/** @returns {import('types').SerializableElement[]} */
SerializableContext.prototype.getExecutableProcesses = function getExecutableProcesses() {
  return this.elements.processes.filter((p) => p.behaviour.isExecutable);
};

/**
 * @param {string} activityId
 * @returns {import('types').SerializableElement[]}
 */
SerializableContext.prototype.getInboundSequenceFlows = function getInboundSequenceFlows(activityId) {
  return this.elements.sequenceFlows.filter((flow) => flow.targetId === activityId);
};

/**
 * @param {string} activityId
 * @returns {import('types').SerializableElement[]}
 */
SerializableContext.prototype.getOutboundSequenceFlows = function getOutboundSequenceFlows(activityId) {
  return this.elements.sequenceFlows.filter((flow) => flow.sourceId === activityId);
};

/**
 * @param {string} [scopeId]
 * @returns {import('types').SerializableElement[]}
 */
SerializableContext.prototype.getMessageFlows = function getMessageFlows(scopeId) {
  const messageFlows = this.elements.messageFlows;
  if (scopeId) return messageFlows.filter((flow) => flow.source.processId === scopeId);
  return messageFlows;
};

/**
 * @param {string} [scopeId]
 * @returns {import('types').SerializableElement[]}
 */
SerializableContext.prototype.getSequenceFlows = function getSequenceFlows(scopeId) {
  const sequenceFlows = this.elements.sequenceFlows;
  if (scopeId) return sequenceFlows.filter((flow) => flow.parent.id === scopeId);
  return sequenceFlows;
};

/**
 * @param {string} flowId
 * @returns {import('types').SerializableElement | undefined}
 */
SerializableContext.prototype.getSequenceFlowById = function getSequenceFlowById(flowId) {
  return this.elements.sequenceFlows.find(({ id }) => id === flowId);
};

/**
 * @param {string} [scopeId]
 * @returns {import('types').SerializableElement[]}
 */
SerializableContext.prototype.getActivities = function getActivities(scopeId) {
  const activities = this.elements.activities;
  if (!scopeId) return activities;
  return activities.filter((activity) => activity.parent.id === scopeId);
};

/**
 * @param {string} [scopeId]
 * @returns {any[]}
 */
SerializableContext.prototype.getDataObjects = function getDataObjects(scopeId) {
  if (!scopeId) return this.elements.dataObjects;
  return this.elements.dataObjects.filter((elm) => elm.parent.id === scopeId);
};

/**
 * @param {string} [scopeId]
 * @returns {any[]}
 */
SerializableContext.prototype.getDataStoreReferences = function getDataStoreReferences(scopeId) {
  if (!scopeId) return this.elements.dataStores;
  return this.elements.dataStores.filter((elm) => elm.parent.id === scopeId);
};

/**
 * @param {string} dataObjectId
 * @returns {any}
 */
SerializableContext.prototype.getDataObjectById = function getDataObjectById(dataObjectId) {
  return this.elements.dataObjects.find(({ id }) => id === dataObjectId);
};

/**
 * @param {string} dataStoreId
 * @returns {any}
 */
SerializableContext.prototype.getDataStoreReferenceById = function getDataStoreReferenceById(dataStoreId) {
  return this.elements.dataStores.find(({ id }) => id === dataStoreId);
};

/** @returns {any[]} */
SerializableContext.prototype.getDataStores = function getDataStores() {
  return this.elements.dataStores.filter(({ type }) => type === 'bpmn:DataStore');
};

/**
 * @param {string} dataStoreId
 * @returns {any}
 */
SerializableContext.prototype.getDataStoreById = function getDataStoreById(dataStoreId) {
  return this.elements.dataStores.find(({ id, type }) => id === dataStoreId && type === 'bpmn:DataStore');
};

/**
 * @param {string} activityId
 * @returns {import('types').SerializableElement | undefined}
 */
SerializableContext.prototype.getActivityById = function getActivityById(activityId) {
  return this.elements.activities.find((activity) => activity.id === activityId);
};

/**
 * @param {string} [scopeId]
 * @returns {import('types').SerializableElement[]}
 */
SerializableContext.prototype.getAssociations = function getAssociations(scopeId) {
  const associations = this.elements.associations;
  if (scopeId) return associations.filter((flow) => flow.parent.id === scopeId);
  return associations;
};

/**
 * @param {string} associationId
 * @returns {import('types').SerializableElement | undefined}
 */
SerializableContext.prototype.getAssociationById = function getAssociationById(associationId) {
  return this.elements.associations.find((association) => association.id === associationId);
};

/** @returns {import('types').ExtendContext} */
SerializableContext.prototype.getExtendContext = function getExtendContext() {
  return new ExtendContext({ scripts: this.elements.scripts, timers: this.elements.timers });
};

/**
 * @param {string} activityId
 * @returns {import('types').SerializableElement[]}
 */
SerializableContext.prototype.getInboundAssociations = function getInboundAssociations(activityId) {
  return this.elements.associations.filter((flow) => flow.targetId === activityId);
};

/**
 * @param {string} activityId
 * @returns {import('types').SerializableElement[]}
 */
SerializableContext.prototype.getOutboundAssociations = function getOutboundAssociations(activityId) {
  return this.elements.associations.filter((flow) => flow.sourceId === activityId);
};

/**
 * @param {string} [elementType]
 * @returns {import('types').Script[]}
 */
SerializableContext.prototype.getScripts = function getScripts(elementType) {
  const scripts = this.elements.scripts;
  if (!elementType) return scripts.slice();
  return scripts.filter(({ parent }) => parent.type === elementType);
};

/**
 * @param {string} elementId
 * @returns {import('types').Script[]}
 */
SerializableContext.prototype.getScriptsByElementId = function getScriptsByElementId(elementId) {
  return this.elements.scripts.filter(({ parent }) => parent.id === elementId);
};

/**
 * @param {string} [elementType]
 * @returns {import('types').Timer[]}
 */
SerializableContext.prototype.getTimers = function getTimers(elementType) {
  const timers = this.elements.timers;
  if (!elementType) return timers.slice();
  return timers.filter(({ parent }) => parent.type === elementType);
};

/**
 * @param {string} elementId
 * @returns {import('types').Timer[]}
 */
SerializableContext.prototype.getTimersByElementId = function getTimersByElementId(elementId) {
  return this.elements.timers.filter(({ parent }) => parent.id === elementId);
};

/**
 * Walk a mapped context and run the resolver against every element that may carry behaviour.
 * The resolver is expected to mutate each entity by attaching a `Behaviour` property.
 *
 * @param {import('types').MappedContext} mappedContext
 * @param {import('types').ResolverFn} typeResolver
 * @returns {import('types').MappedContext}
 */
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

/**
 * @this {Mapper}
 * @param {import('types').BPMNModel} moddleContext
 * @param {import('types').ExtendFn} [extendFn]
 */
function Mapper(moddleContext, extendFn) {
  this.moddleContext = moddleContext;
  this._extendFn = extendFn;
  /** @type {import('types').Script[]} */
  this.scripts = [];
  /** @type {import('types').Timer[]} */
  this.timers = [];
  /** @type {import('types').References} */
  this._references = /** @type {any} */ (undefined);
  /** @type {any} */
  this._root = undefined;
}

/** @returns {import('types').MappedContext} */
Mapper.prototype.map = function MapperConstructor() {
  const moddleContext = this.moddleContext;
  const rootElement = (this._root = moddleContext.rootElement
    ? moddleContext.rootElement
    : // @ts-expect-error - bpmn-moddle@6 callback context, not in BPMNModel type
      moddleContext.rootHandler.element);
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

/**
 * @internal
 * @returns {import('types').References}
 */
Mapper.prototype._prepareReferences = function prepareReferences() {
  /** @type {import('types').References} */
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

  for (const r of /** @type {any[]} */ (references)) {
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
 * @internal
 * Upsert flow ref.
 * @param {Map<string, import('types').FlowRef>} target
 * @param {string} id - element id
 * @param {import('types').FlowRef} value - flow node element ref (partial)
 */
Mapper.prototype._upsertFlowRef = function upsertFlowRef(target, id, value) {
  if (!target.has(id)) {
    target.set(id, value);
  } else {
    Object.assign(target.get(id), value);
  }
};

/**
 * @internal
 * @param {Partial<import('types').Parent>} parent
 * @param {any[]} [elements]
 * @returns {{
 *   activities: import('types').SerializableElement[];
 *   associations: import('types').SerializableElement[];
 *   dataObjects: any[];
 *   dataStores: any[];
 *   messageFlows: import('types').SerializableElement[];
 *   participants: any[];
 *   processes: import('types').SerializableElement[];
 *   sequenceFlows: import('types').SerializableElement[];
 * }}
 */
Mapper.prototype._prepareElements = function prepareElements(parent, elements) {
  /** @type {{
   *   activities: import('types').SerializableElement[];
   *   associations: import('types').SerializableElement[];
   *   dataObjects: any[];
   *   dataStores: any[];
   *   messageFlows: import('types').SerializableElement[];
   *   participants: any[];
   *   processes: import('types').SerializableElement[];
   *   sequenceFlows: import('types').SerializableElement[];
   * }} */
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

/**
 * @internal
 * @param {any} element
 * @param {Partial<import('types').Parent>} parent
 * @param {Record<string, any>} [behaviour]
 * @returns {import('types').SerializableElement}
 */
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

/**
 * @internal
 * @param {any} element
 * @param {Record<string, any>} [behaviour]
 * @returns {Record<string, any>}
 */
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
    /** @type {any[]} */
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
    /** @type {{ type: string; values: any[] }} */
    const props = (preparedElement.properties = { type: 'properties', values: [] });
    for (const prop of properties) {
      props.values.push(this._mapActivityBehaviour(prop, extendContext));
    }
  }

  if (ioSpecification) {
    preparedElement.ioSpecification = this._mapActivityBehaviour(ioSpecification, extendContext);
  }

  if (element.dataInputAssociations) {
    /** @type {any[]} */
    const associations = (preparedElement.dataInputAssociations = []);
    for (const association of element.dataInputAssociations) {
      associations.push(this._mapActivityBehaviour(association, extendContext));
    }
  }
  if (element.dataOutputAssociations) {
    /** @type {any[]} */
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
    /** @type {any[]} */
    const lanes = (preparedElement.lanes = []);
    for (const laneSet of element.laneSets) {
      for (const lane of laneSet.lanes) {
        lanes.push(this._mapActivityBehaviour(lane, extendContext));
      }
    }
  }

  if (element.resources) {
    /** @type {any[]} */
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

/**
 * @internal
 * @param {any} ed
 * @param {ExtendContext} extendContext
 * @returns {{ id: string; type: string; behaviour: Record<string, any> } | undefined}
 */
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

/**
 * @internal
 * @param {any} propertyDef
 * @returns {Record<string, any>}
 */
Mapper.prototype._preparePropertyBehaviour = function preparePropertyBehaviour(propertyDef) {
  const dataInput = this._getDataInputBehaviour(propertyDef.id);
  const dataOutput = this._getDataOutputBehaviour(propertyDef.id);

  return {
    ...propertyDef,
    ...(dataInput.association.source && { dataInput }),
    ...(dataOutput.association.target && { dataOutput }),
  };
};

/**
 * @internal
 * @param {{ dataInputs?: any[]; dataOutputs?: any[] }} _ioSpec
 * @returns {{ dataInputs?: any[]; dataOutputs?: any[] }}
 */
Mapper.prototype._prepareIoSpecificationBehaviour = function prepareIoSpecificationBehaviour({ dataInputs, dataOutputs }) {
  /** @type {{ dataInputs?: any[]; dataOutputs?: any[] }} */
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

/**
 * @internal
 * @param {{ id: string }} element
 * @returns {Array<{ id: string; type: string; behaviour: Record<string, any> }>}
 */
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

/**
 * @internal
 * @param {string} dataInputId
 * @returns {{ association: { source: any; target: any } }}
 */
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

/**
 * @internal
 * @param {string} dataOutputId
 * @returns {{ association: { source: any; target: any } }}
 */
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

/**
 * @internal
 * @param {string} referenceId
 * @returns {{ dataObject?: any; dataStore?: any }}
 */
Mapper.prototype._getDataRef = function getDataRef(referenceId) {
  const dataObject = this._getDataObject(referenceId);
  const dataStore = this._getDataStore(referenceId);

  return {
    ...(dataObject && { dataObject }),
    ...(dataStore && { dataStore }),
  };
};

/**
 * @internal
 * @param {string} referenceId
 * @returns {any}
 */
Mapper.prototype._getDataObject = function getDataObject(referenceId) {
  const dataReference = this._references.dataObjectRefs.find((dor) => dor.element && dor.element.id === referenceId);
  if (!dataReference) {
    const dataElm = this.moddleContext.elementsById[referenceId];
    return dataElm && dataElm.$type === 'bpmn:DataObject' && { ...dataElm };
  }

  return { ...this.moddleContext.elementsById[dataReference.id] };
};

/**
 * @internal
 * @param {string} referenceId
 * @returns {any}
 */
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

/**
 * @internal
 * @param {{ id: string }} element
 * @returns {Array<{ id: string; type: string; behaviour: Record<string, any> }>}
 */
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

/**
 * @internal
 * @param {import('types').FlowRef} flowRef
 * @returns {{ source: any; target: any }}
 */
Mapper.prototype._getMessageFlowSourceAndTarget = function getMessageFlowSourceAndTarget(flowRef) {
  return {
    source: this._getElementRef(flowRef.sourceId),
    target: this._getElementRef(flowRef.targetId),
  };
};

/**
 * @internal
 * @param {string} elementId
 * @returns {Record<string, any> | undefined}
 */
Mapper.prototype._getElementRef = function getElementRef(elementId) {
  const targetElement = /** @type {any} */ (this.moddleContext.elementsById[elementId]);
  if (!targetElement) return;

  /** @type {Record<string, any>} */
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
      const bp = this._root.rootElements.find(
        (/** @type {any} */ e) => e.$type === 'bpmn:Process' && e.flowElements.find((/** @type {any} */ ce) => ce.id === elementId),
      );
      result.processId = bp.id;
      result.id = elementId;
    }
  }

  return result;
};

/**
 * @this {ExtendContext}
 * @param {{ scripts: import('types').Script[]; timers?: import('types').Timer[]; parent?: import('types').Parent }} _opts
 */
function ExtendContext({ scripts, timers = [], parent }) {
  this.scripts = scripts;
  this.timers = timers;
  this._parent = parent;
}

/**
 * @param {string} scriptName
 * @param {import('types').ScriptElement} elm
 */
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

/**
 * @param {string} timerName
 * @param {import('types').TimerElement} _timer
 */
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

/**
 * @internal
 * @param {string} name
 * @param {{ id?: string; type?: string }} [parent]
 * @returns {{ name: string; parent?: import('types').Parent }}
 */
ExtendContext.prototype._prepare = function prepare(name, { id, type } = {}) {
  return {
    name,
    ...(id && type && { parent: { id, type } }),
  };
};

/**
 * @param {{ id: string; $type: string; name?: string }} _ref
 * @returns {{ id: string; type: string; name?: string }}
 */
function spreadRef({ id, $type: type, name }) {
  return { id, type, name };
}
