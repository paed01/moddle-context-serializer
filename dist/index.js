"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TypeResolver = TypeResolver;
exports.resolveTypes = resolveTypes;
exports.map = mapModdleContext;
exports.deserialize = deserialize;
exports.default = void 0;
var _default = context;
exports.default = _default;

function context(moddleContext, typeResolver) {
  const mapped = mapModdleContext(moddleContext);
  return contextApi(resolveTypes(mapped, typeResolver));
}

function deserialize(deserializedContext, typeResolver) {
  return contextApi(resolveTypes(deserializedContext, typeResolver));
}

function contextApi(mapped) {
  const {
    activities,
    dataObjects,
    definition,
    errors,
    messageFlows,
    processes,
    sequenceFlows
  } = mapped;
  return {
    id: definition.id,
    type: definition.type,
    name: definition.name,
    getActivities,
    getActivityById,
    getDataObjects,
    getDataObjectById,
    getErrorById,
    getErrors,
    getExecutableProcesses,
    getInboundSequenceFlows,
    getMessageFlows,
    getOutboundSequenceFlows,
    getProcessById,
    getProcesses,
    getSequenceFlowById,
    getSequenceFlows,
    serialize
  };

  function serialize() {
    return JSON.stringify({
      id: definition.id,
      type: definition.type,
      name: definition.name,
      activities,
      dataObjects,
      definition,
      errors,
      messageFlows,
      processes,
      sequenceFlows
    });
  }

  function getProcessById(processId) {
    return processes.find(({
      id
    }) => id === processId);
  }

  function getProcesses() {
    return processes;
  }

  function getExecutableProcesses() {
    return processes.filter(p => p.behaviour.isExecutable);
  }

  function getInboundSequenceFlows(activityId) {
    return sequenceFlows.filter(flow => flow.targetId === activityId);
  }

  function getOutboundSequenceFlows(activityId) {
    return sequenceFlows.filter(flow => flow.sourceId === activityId);
  }

  function getMessageFlows(scopeId) {
    if (scopeId) return messageFlows.filter(flow => flow.source.processId === scopeId);
    return messageFlows;
  }

  function getSequenceFlows(scopeId) {
    if (scopeId) return sequenceFlows.filter(flow => flow.parent.id === scopeId);
    return sequenceFlows;
  }

  function getSequenceFlowById(flowId) {
    return sequenceFlows.find(({
      id
    }) => id === flowId);
  }

  function getActivities(scopeId) {
    if (!scopeId) return activities;
    return activities.filter(activity => activity.parent.id === scopeId);
  }

  function getDataObjects() {
    return dataObjects;
  }

  function getErrors() {
    return errors;
  }

  function getErrorById(errorId) {
    return errors.find(({
      id
    }) => id === errorId);
  }

  function getDataObjectById(dataObjectId) {
    return dataObjects.find(({
      id
    }) => id === dataObjectId);
  }

  function getActivityById(actvitiyId) {
    return activities.find(activity => activity.id === actvitiyId);
  }
}

function resolveTypes(mappedContext, typeResolver) {
  const {
    definition,
    activities,
    dataObjects,
    errors,
    messageFlows,
    processes,
    sequenceFlows
  } = mappedContext;
  definition.Behaviour = typeResolver(definition);
  processes.forEach(typeResolver);
  activities.forEach(typeResolver);
  dataObjects.forEach(typeResolver);
  errors.forEach(typeResolver);
  messageFlows.forEach(typeResolver);
  sequenceFlows.forEach(typeResolver);
  return mappedContext;
}

function mapModdleContext(moddleContext) {
  const {
    elementsById,
    references,
    rootHandler
  } = moddleContext;
  const definition = {
    id: rootHandler.element.id,
    type: rootHandler.element.$type,
    name: rootHandler.element.name,
    targetNamespace: rootHandler.element.targetNamespace,
    exporter: rootHandler.element.exporter,
    exporterVersion: rootHandler.element.exporterVersion
  };
  const {
    attachedToRefs,
    dataInputAssociations,
    dataObjectRefs,
    dataOutputAssociations,
    errorRefs,
    flowRefs
  } = prepareReferences();
  const {
    activities,
    dataObjects,
    errors,
    messageFlows,
    processes,
    sequenceFlows
  } = prepareElements(definition, rootHandler.element.rootElements);
  return {
    definition,
    activities,
    dataObjects,
    errors,
    messageFlows,
    processes,
    sequenceFlows
  };

  function prepareReferences() {
    return references.reduce((result, r) => {
      const {
        property,
        element
      } = r;

      switch (property) {
        case 'bpmn:attachedToRef':
          result.attachedToRefs.push(r);
          break;

        case 'bpmn:errorRef':
          result.errorRefs.push(r);
          break;

        case 'bpmn:sourceRef':
          {
            const flow = upsertFlowRef(element.id, {
              id: element.id,
              $type: element.$type,
              sourceId: r.id,
              element: elementsById[element.id]
            });
            const outbound = result.sourceRefs[r.id] = result.sourceRefs[r.id] || [];
            outbound.push(flow);
            break;
          }

        case 'bpmn:targetRef':
          {
            const flow = upsertFlowRef(element.id, {
              targetId: r.id
            });
            const inbound = result.targetRefs[r.id] = result.targetRefs[r.id] || [];
            inbound.push(flow);
            break;
          }

        case 'bpmn:default':
          upsertFlowRef(r.id, {
            isDefault: true
          });
          break;

        case 'bpmn:dataObjectRef':
          result.dataObjectRefs.push(r);
          break;
      }

      switch (element.$type) {
        case 'bpmn:OutputSet':
        case 'bpmn:InputSet':
          {
            break;
          }

        case 'bpmn:DataInputAssociation':
          result.dataInputAssociations.push(r);
          break;

        case 'bpmn:DataOutputAssociation':
          result.dataOutputAssociations.push(r);
          break;
      }

      return result;

      function upsertFlowRef(id, value) {
        const flow = result.flowRefs[id] = result.flowRefs[id] || {};
        Object.assign(flow, value);
        return flow;
      }
    }, {
      attachedToRefs: [],
      dataInputAssociations: [],
      dataObjectRefs: [],
      dataOutputAssociations: [],
      errorRefs: [],
      flowRefs: {},
      sourceRefs: {},
      targetRefs: {}
    });
  }

  function prepareElements(parent, elements) {
    if (!elements) return {};
    return elements.reduce((result, element) => {
      const {
        id,
        $type: type,
        name
      } = element;
      let attachedTo;

      switch (element.$type) {
        case 'bpmn:DataObjectReference':
        case 'bpmn:Message':
          break;

        case 'bpmn:Collaboration':
          {
            if (element.messageFlows) {
              const {
                messageFlows: flows
              } = prepareElements(parent, element.messageFlows);
              result.messageFlows = result.messageFlows.concat(flows);
            }

            break;
          }

        case 'bpmn:MessageFlow':
          {
            const flowRef = flowRefs[element.id];
            result.messageFlows.push({ ...flowRef,
              id,
              type,
              name,
              parent: {
                id: parent.id,
                type: parent.type
              },
              source: {
                processId: getElementProcessId(flowRef.sourceId),
                id: flowRef.sourceId
              },
              target: {
                processId: getElementProcessId(flowRef.targetId),
                id: flowRef.targetId
              },
              behaviour: { ...element
              }
            });
            break;
          }

        case 'bpmn:Error':
          {
            result.errors.push({
              id,
              type,
              name,
              parent: {
                id: parent.id,
                type: parent.type
              },
              behaviour: { ...element
              }
            });
            break;
          }

        case 'bpmn:DataObject':
          {
            result.dataObjects.push({
              id,
              name,
              type,
              parent: {
                id: parent.id,
                type: parent.type
              },
              references: prepareDataObjectReferences(),
              behaviour: { ...element
              }
            });
            break;
          }

        case 'bpmn:SequenceFlow':
          {
            const flowRef = flowRefs[element.id];
            result.sequenceFlows.push({
              id,
              name,
              type,
              parent: {
                id: parent.id,
                type: parent.type
              },
              isDefault: flowRef.isDefault,
              targetId: flowRef.targetId,
              sourceId: flowRef.sourceId,
              behaviour: { ...element
              }
            });
            break;
          }

        case 'bpmn:SubProcess':
        case 'bpmn:Process':
          {
            const bp = {
              id,
              type,
              name,
              parent: {
                id: parent.id,
                type: parent.type
              },
              behaviour: prepareActivityBehaviour()
            };
            if (type === 'bpmn:Process') result.processes.push(bp);else result.activities.push(bp);
            const subElements = prepareElements({
              id,
              type
            }, element.flowElements);

            if (subElements.activities) {
              result.activities = result.activities.concat(subElements.activities);
            }

            if (subElements.sequenceFlows) {
              result.sequenceFlows = result.sequenceFlows.concat(subElements.sequenceFlows);
            }

            if (subElements.dataObjects) {
              result.dataObjects = result.dataObjects.concat(subElements.dataObjects);
            }

            break;
          }

        case 'bpmn:BoundaryEvent':
          {
            attachedTo = attachedToRefs.find(r => r.element.id === id);
            result.activities.push(prepareActivity({
              attachedTo
            }));
            break;
          }

        case 'bpmn:SendTask':
        case 'bpmn:ServiceTask':
          {
            result.activities.push(prepareActivity());
            break;
          }

        default:
          {
            result.activities.push(prepareActivity());
          }
      }

      return result;

      function prepareActivity(behaviour) {
        return {
          id,
          type,
          name,
          parent: {
            id: parent.id,
            type: parent.type
          },
          behaviour: prepareActivityBehaviour(behaviour)
        };
      }

      function prepareActivityBehaviour(behaviour) {
        const resources = element.resources && element.resources.map(mapResource);
        return { ...behaviour,
          ...element,
          eventDefinitions: element.eventDefinitions && element.eventDefinitions.map(mapActivityBehaviour),
          loopCharacteristics: element.loopCharacteristics && mapActivityBehaviour(element.loopCharacteristics),
          ioSpecification: element.ioSpecification && mapActivityBehaviour(element.ioSpecification),
          resources
        };
      }

      function prepareDataObjectReferences() {
        const objectRefs = dataObjectRefs.filter(objectRef => objectRef.id === element.id);
        return objectRefs.map(objectRef => {
          return {
            id: objectRef.element.id,
            type: objectRef.element.$type,
            behaviour: { ...objectRef.element
            }
          };
        });
      }
    }, {
      activities: [],
      dataObjects: [],
      errors: [],
      messageFlows: [],
      processes: [],
      sequenceFlows: []
    });
  }

  function getElementProcessId(elementId) {
    const bp = rootHandler.element.rootElements.find(e => e.$type === 'bpmn:Process' && e.flowElements.find(ce => ce.id === elementId));
    return bp.id;
  }

  function mapResource(resource) {
    if (!resource) return;
    const {
      $type: type,
      resourceAssignmentExpression
    } = resource;
    return {
      type,
      expression: resourceAssignmentExpression.expression && resourceAssignmentExpression.expression.body,
      behaviour: { ...resource
      }
    };
  }

  function mapActivityBehaviour(ed) {
    if (!ed) return;
    const {
      $type: type
    } = ed;
    let behaviour = { ...ed
    };

    switch (type) {
      case 'bpmn:InputOutputSpecification':
        {
          behaviour = prepareIoSpecificationBehaviour(ed);
          break;
        }

      case 'bpmn:MultiInstanceLoopCharacteristics':
        {
          behaviour.loopCardinality = ed.loopCardinality && ed.loopCardinality.body;
          behaviour.completionCondition = ed.completionCondition && ed.completionCondition.body;
          break;
        }

      case 'bpmn:TimerEventDefinition':
        {
          behaviour.timeDuration = ed.timeDuration && ed.timeDuration.body;
        }

      case 'bpmn:ErrorEventDefinition':
        {
          const errorRef = errorRefs.find(r => r.element === ed);
          behaviour.errorRef = errorRef && { ...errorRef
          };
        }
    }

    return {
      type,
      behaviour
    };
  }

  function prepareIoSpecificationBehaviour(ioSpecificationDef) {
    const {
      dataInputs,
      dataOutputs
    } = ioSpecificationDef;
    return {
      dataInputs: dataInputs && dataInputs.map(dataDef => {
        return { ...dataDef,
          type: dataDef.$type,
          behaviour: getDataInputBehaviour(dataDef.id)
        };
      }),
      dataOutputs: dataOutputs && dataOutputs.map(dataDef => {
        return { ...dataDef,
          type: dataDef.$type,
          behaviour: getDataOutputBehaviour(dataDef.id)
        };
      })
    };
  }

  function getDataInputBehaviour(dataInputId) {
    const target = dataInputAssociations.find(assoc => assoc.property === 'bpmn:targetRef' && assoc.id === dataInputId && assoc.element);
    const source = target && dataInputAssociations.find(assoc => assoc.property === 'bpmn:sourceRef' && assoc.element && assoc.element.id === target.element.id);
    return {
      association: {
        source: source && { ...source,
          dataObject: getDataObjectRef(source.id)
        },
        target: target && { ...target
        }
      }
    };
  }

  function getDataObjectRef(dataObjectReferenceId) {
    const dataObjectRef = dataObjectRefs.find(dor => dor.element && dor.element.id === dataObjectReferenceId);
    if (!dataObjectRef) return;
    return { ...dataObjectRef
    };
  }

  function getDataOutputBehaviour(dataOutputId) {
    const source = dataOutputAssociations.find(assoc => assoc.property === 'bpmn:sourceRef' && assoc.id === dataOutputId && assoc.element);
    const target = source && dataOutputAssociations.find(assoc => assoc.property === 'bpmn:targetRef' && assoc.element && assoc.element.id === source.element.id);
    return {
      association: {
        source: source && { ...source
        },
        target: target && { ...target,
          dataObject: getDataObjectRef(target.id)
        }
      }
    };
  }
}

function TypeResolver(types, extender) {
  const {
    BoundaryEvent,
    BpmnError,
    DataObject,
    Definition,
    Dummy,
    EndEvent,
    ErrorEventDefinition,
    ExclusiveGateway,
    InclusiveGateway,
    IntermediateCatchEvent,
    IoSpecification,
    MessageEventDefinition,
    MessageFlow,
    MultiInstanceLoopCharacteristics,
    ParallelGateway,
    Process,
    ScriptTask,
    SequenceFlow,
    ServiceImplementation,
    ServiceTask,
    SignalTask,
    StartEvent,
    SubProcess,
    Task,
    TerminateEventDefinition,
    TimerEventDefinition
  } = types;
  const activityTypes = {};
  activityTypes['bpmn:BoundaryEvent'] = BoundaryEvent;
  activityTypes['bpmn:DataObjectReference'] = Dummy;
  activityTypes['bpmn:DataObject'] = DataObject;
  activityTypes['bpmn:Definitions'] = Definition;
  activityTypes['bpmn:EndEvent'] = EndEvent;
  activityTypes['bpmn:Error'] = BpmnError;
  activityTypes['bpmn:ErrorEventDefinition'] = ErrorEventDefinition;
  activityTypes['bpmn:ExclusiveGateway'] = ExclusiveGateway;
  activityTypes['bpmn:InclusiveGateway'] = InclusiveGateway;
  activityTypes['bpmn:IntermediateCatchEvent'] = IntermediateCatchEvent;
  activityTypes['bpmn:ManualTask'] = SignalTask;
  activityTypes['bpmn:MessageEventDefinition'] = MessageEventDefinition;
  activityTypes['bpmn:MessageFlow'] = MessageFlow;
  activityTypes['bpmn:Process'] = Process;
  activityTypes['bpmn:ParallelGateway'] = ParallelGateway;
  activityTypes['bpmn:ReceiveTask'] = SignalTask;
  activityTypes['bpmn:ScriptTask'] = ScriptTask;
  activityTypes['bpmn:SendTask'] = ServiceTask;
  activityTypes['bpmn:SequenceFlow'] = SequenceFlow;
  activityTypes['bpmn:ServiceTask'] = ServiceTask;
  activityTypes['bpmn:StartEvent'] = StartEvent;
  activityTypes['bpmn:SubProcess'] = SubProcess;
  activityTypes['bpmn:Task'] = Task;
  activityTypes['bpmn:TerminateEventDefinition'] = TerminateEventDefinition;
  activityTypes['bpmn:TimerEventDefinition'] = TimerEventDefinition;
  activityTypes['bpmn:UserTask'] = SignalTask;
  activityTypes['bpmn:MultiInstanceLoopCharacteristics'] = MultiInstanceLoopCharacteristics;
  activityTypes['bpmn:InputOutputSpecification'] = IoSpecification;
  if (extender) extender(activityTypes);
  return function resolve(entity) {
    const {
      type,
      behaviour = {}
    } = entity;

    switch (type) {
      case 'bpmn:SendTask':
      case 'bpmn:ServiceTask':
        entity.Behaviour = getBehaviourFromType(type);

        if (behaviour.implementation) {
          behaviour.Service = ServiceImplementation;
        }

        break;

      default:
        entity.Behaviour = getBehaviourFromType(type);
    }

    if (behaviour.loopCharacteristics) {
      resolve(behaviour.loopCharacteristics);
    }

    if (behaviour.eventDefinitions) {
      behaviour.eventDefinitions.forEach(resolve);
    }

    if (behaviour.ioSpecification) {
      resolve(behaviour.ioSpecification);
    }
  };

  function getBehaviourFromType(type) {
    const activityType = activityTypes[type];

    if (!activityType) {
      throw new Error(`Unknown activity type ${type}`);
    }

    return activityType;
  }
}