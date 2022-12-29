import factory from './helpers/factory.js';
import testHelpers from './helpers/testHelpers.js';
import types from './helpers/types.js';

import {default as Serializer, TypeResolver, deserialize} from '../index.js';

const typeResolver = TypeResolver(types);
const camunda = testHelpers.getCamundaExtension();

describe('io', () => {
  describe('dataStoreReference', () => {
    let moddleContext;

    it('activity with data association returns ioSpecification with reference to dataStoreReference', async () => {
      const source = factory.resource('signals.bpmn');
      moddleContext = await testHelpers.moddleContext(source, {
        camunda,
      });

      const serializer = Serializer(moddleContext, typeResolver);
      const activityOut = serializer.getActivityById('approveSpotPrice');

      const outAssociations = activityOut.behaviour.dataOutputAssociations;
      expect(outAssociations).to.have.length(1);
      const [outAssociation] = outAssociations;

      expect(outAssociation).to.have.property('type', 'bpmn:DataOutputAssociation');
      expect(outAssociation).to.have.property('id');
      expect(outAssociation).to.have.property('behaviour');
      expect(outAssociation.behaviour).to.have.property('targetRef');
      expect(outAssociation.behaviour.targetRef).to.have.property('type', 'bpmn:DataStoreReference');
      expect(outAssociation.behaviour.targetRef).to.have.property('id', 'SpotPriceDb');

      expect(outAssociation.behaviour).to.not.have.property('sourceRef');

      const activityIn = serializer.getActivityById('getSpotPrice');

      const inAssociations = activityIn.behaviour.dataInputAssociations;
      expect(inAssociations).to.have.length(1);
      const [inAssociation] = inAssociations;

      expect(inAssociation).to.have.property('type', 'bpmn:DataInputAssociation');
      expect(inAssociation).to.have.property('id');
      expect(inAssociation).to.have.property('behaviour');
      expect(inAssociation.behaviour).to.have.property('sourceRef');
      expect(inAssociation.behaviour.sourceRef).to.have.property('type', 'bpmn:DataStoreReference');
      expect(inAssociation.behaviour.sourceRef).to.have.property('id', 'SpotPriceDb');
      expect(inAssociation.behaviour).to.have.property('targetRef');
      expect(inAssociation.behaviour.targetRef).to.have.property('type', 'bpmn:Property');
      expect(inAssociation.behaviour.targetRef).to.have.property('id', 'Property_05an4u6');
    });

    it('deserialized keeps references', async () => {
      const source = factory.resource('signals.bpmn');
      moddleContext = await testHelpers.moddleContext(source, {
        camunda,
      });

      const serializer = Serializer(moddleContext, typeResolver);
      const state = serializer.serialize();
      const deserialized = deserialize(JSON.parse(state), typeResolver);

      const activityOut = deserialized.getActivityById('approveSpotPrice');

      const outAssociations = activityOut.behaviour.dataOutputAssociations;
      expect(outAssociations).to.have.length(1);
      const [outAssociation] = outAssociations;

      expect(outAssociation).to.have.property('type', 'bpmn:DataOutputAssociation');
      expect(outAssociation).to.have.property('id');
      expect(outAssociation).to.have.property('behaviour');
      expect(outAssociation.behaviour).to.have.property('targetRef');
      expect(outAssociation.behaviour.targetRef).to.have.property('type', 'bpmn:DataStoreReference');
      expect(outAssociation.behaviour.targetRef).to.have.property('id', 'SpotPriceDb');

      expect(outAssociation.behaviour).to.not.have.property('sourceRef');

      const activityIn = serializer.getActivityById('getSpotPrice');

      const inAssociations = activityIn.behaviour.dataInputAssociations;
      expect(inAssociations).to.have.length(1);
      const [inAssociation] = inAssociations;

      expect(inAssociation).to.have.property('type', 'bpmn:DataInputAssociation');
      expect(inAssociation).to.have.property('id');
      expect(inAssociation).to.have.property('behaviour');
      expect(inAssociation.behaviour).to.have.property('sourceRef');
      expect(inAssociation.behaviour.sourceRef).to.have.property('type', 'bpmn:DataStoreReference');
      expect(inAssociation.behaviour.sourceRef).to.have.property('id', 'SpotPriceDb');
      expect(inAssociation.behaviour).to.have.property('targetRef');
      expect(inAssociation.behaviour.targetRef).to.have.property('type', 'bpmn:Property');
      expect(inAssociation.behaviour.targetRef).to.have.property('id', 'Property_05an4u6');
    });
  });

  describe('ioSpecification', () => {
    const source = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <process id="theProcess" isExecutable="true">
        <dataObject id="userInfo" />
        <dataObject id="global" />
        <dataObject id="noref" />
        <dataObjectReference id="inputToUserRef" dataObjectRef="userInfo" />
        <dataObjectReference id="outputFromUserRef" dataObjectRef="global" />
        <dataObjectReference id="globalRef" dataObjectRef="global" />
        <userTask id="userTask">
          <ioSpecification id="inputSpec">
            <dataInput id="userInput" name="info" />
            <dataOutput id="userOutput" name="result" />
          </ioSpecification>
          <dataInputAssociation id="associatedWith" sourceRef="inputToUserRef" targetRef="userInput" />
          <dataOutputAssociation id="associatedWithOut" sourceRef="userOutput" targetRef="outputFromUserRef" />
        </userTask>
      </process>
      <process id="theOtherProcess" isExecutable="true">
        <dataObject id="duplex" />
        <dataObjectReference id="inputToUserRefTo" dataObjectRef="duplex" />
        <userTask id="userTaskTo">
          <ioSpecification id="inputSpecTo">
            <dataInput id="userInputTo" name="info" />
            <dataOutput id="userOutputTo" name="info" />
            <inputSet id="inputGroup">
              <dataInputRefs>userInputTo</dataInputRefs>
            </inputSet>
            <outputSet id="outputGroup">
              <dataOutputRefs>userOutputTo</dataOutputRefs>
            </outputSet>
          </ioSpecification>
          <dataInputAssociation id="associatedWithTo" sourceRef="inputToUserRefTo" targetRef="userInputTo" />
          <dataOutputAssociation id="associatedWithTo" sourceRef="userOutputTo" targetRef="inputToUserRefTo" />
        </userTask>
      </process>
    </definitions>`;

    let contextMapper;
    before(async () => {
      const moddleContext = await testHelpers.moddleContext(source);
      contextMapper = Serializer(moddleContext, typeResolver);
    });

    it('getDataObjects() returns dataObjects', () => {
      const dataObjects = contextMapper.getDataObjects();
      expect(dataObjects).to.have.length(4);

      dataObjects.forEach((dataObject) => {
        expect(dataObject).to.have.property('id').that.is.ok;
        expect(dataObject).to.have.property('parent').that.is.ok;
        expect(dataObject.parent).to.have.property('id').that.is.ok;
        expect(dataObject.parent).to.have.property('type', 'bpmn:Process');
      });
    });

    it('getDataObjects(scopeId) returns dataObjects for scope', () => {
      const dataObjects = contextMapper.getDataObjects('theProcess');
      expect(dataObjects).to.have.length(3);

      dataObjects.forEach((dataObject) => {
        expect(dataObject).to.have.property('id').that.is.ok;
        expect(dataObject).to.have.property('parent').that.is.ok;
        expect(dataObject.parent).to.have.property('id').to.equal('theProcess');
        expect(dataObject.parent).to.have.property('type', 'bpmn:Process');
      });
    });

    it('getDataObjectById() returns dataObject', () => {
      const dataObject = contextMapper.getDataObjectById('global');
      expect(dataObject).to.have.property('id', 'global');
      expect(dataObject).to.have.property('Behaviour', types.DataObject);
    });

    it('activity with InputOutputSpecification returns ioSpecification with reference to dataObject', () => {
      const activity = contextMapper.getActivityById('userTask');
      const ioSpecification = activity.behaviour.ioSpecification;
      expect(ioSpecification).to.be.ok;
      expect(ioSpecification).to.have.property('Behaviour', types.InputOutputSpecification);

      expect(ioSpecification).to.have.property('behaviour').with.property('dataInputs').with.length(1);

      expect(ioSpecification.behaviour.dataInputs[0]).to.have.property('id', 'userInput');
      expect(ioSpecification.behaviour.dataInputs[0]).to.have.property('name', 'info');

      expect(ioSpecification.behaviour.dataInputs[0])
        .to.have.property('behaviour')
        .with.property('association')
        .with.property('source')
        .with.property('dataObject')
        .with.property('id', 'userInfo');

      expect(ioSpecification).to.have.property('behaviour').with.property('dataOutputs').with.length(1);

      expect(ioSpecification.behaviour.dataOutputs[0]).to.have.property('id', 'userOutput');
      expect(ioSpecification.behaviour.dataOutputs[0]).to.have.property('name', 'result');

      expect(ioSpecification.behaviour.dataOutputs[0])
        .to.have.property('behaviour')
        .with.property('association')
        .with.property('target')
        .with.property('dataObject')
        .with.property('id', 'global');
    });

    it('activity with IoSpecification input- outputSets returns ioSpecification with reference to dataObject', () => {
      const activity = contextMapper.getActivityById('userTaskTo');
      const ioSpecification = activity.behaviour.ioSpecification;

      expect(ioSpecification).to.be.ok;
      expect(ioSpecification).to.have.property('Behaviour', types.InputOutputSpecification);

      expect(ioSpecification).to.have.property('behaviour').with.property('dataInputs').with.length(1);

      expect(ioSpecification.behaviour.dataInputs[0]).to.have.property('id', 'userInputTo');
      expect(ioSpecification.behaviour.dataInputs[0]).to.have.property('name', 'info');

      expect(ioSpecification.behaviour.dataInputs[0])
        .to.have.property('behaviour')
        .with.property('association')
        .with.property('source')
        .with.property('dataObject')
        .with.property('id', 'duplex');

      expect(ioSpecification).to.have.property('behaviour').with.property('dataOutputs').with.length(1);

      expect(ioSpecification.behaviour.dataOutputs[0]).to.have.property('id', 'userOutputTo');
      expect(ioSpecification.behaviour.dataOutputs[0]).to.have.property('name', 'info');

      expect(ioSpecification.behaviour.dataOutputs[0])
        .to.have.property('behaviour')
        .with.property('association')
        .with.property('target')
        .with.property('dataObject')
        .with.property('id', 'duplex');
    });

    it('input and output only', async () => {
      const source2 = `
      <?xml version="1.0" encoding="UTF-8"?>
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <process id="theProcess" isExecutable="true">
          <dataObject id="userInfo" />
          <dataObject id="global" />
          <dataObject id="noref" />
          <dataObjectReference id="inputToUserRef" dataObjectRef="userInfo" />
          <dataObjectReference id="outputFromUserRef" dataObjectRef="global" />
          <dataObjectReference id="globalRef" dataObjectRef="global" />
          <userTask id="userTask">
            <ioSpecification id="inputSpec">
              <dataInput id="userInput" name="info" />
            </ioSpecification>
            <dataInputAssociation id="associatedWith" sourceRef="inputToUserRef" targetRef="userInput" />
          </userTask>
        </process>
        <process id="theOtherProcess" isExecutable="true">
          <dataObject id="duplex" />
          <dataObjectReference id="inputToUserRefTo" dataObjectRef="duplex" />
          <userTask id="userTaskTo">
            <ioSpecification id="inputSpecTo">
              <dataOutput id="userOutputTo" name="info" />
              <outputSet id="outputGroup">
                <dataOutputRefs>userOutputTo</dataOutputRefs>
              </outputSet>
            </ioSpecification>
            <dataOutputAssociation id="associatedWithTo" sourceRef="userOutputTo" targetRef="inputToUserRefTo" />
          </userTask>
        </process>
      </definitions>`;

      const mc = await testHelpers.moddleContext(source2);
      const serializer = Serializer(mc, typeResolver);

      const task1 = serializer.getActivityById('userTask');
      const ioSpecification1 = task1.behaviour.ioSpecification;
      expect(ioSpecification1).to.be.ok;
      expect(ioSpecification1).to.have.property('Behaviour', types.InputOutputSpecification);

      expect(ioSpecification1).to.have.property('behaviour').with.property('dataInputs').with.length(1);

      expect(ioSpecification1.behaviour.dataInputs[0]).to.have.property('id', 'userInput');
      expect(ioSpecification1.behaviour.dataInputs[0]).to.have.property('name', 'info');

      expect(ioSpecification1.behaviour).to.not.have.property('dataOutputs');

      const task2 = serializer.getActivityById('userTaskTo');
      const ioSpecification2 = task2.behaviour.ioSpecification;
      expect(ioSpecification2).to.be.ok;
      expect(ioSpecification2).to.have.property('Behaviour', types.InputOutputSpecification);

      expect(ioSpecification2).to.have.property('behaviour').with.property('dataOutputs').with.length(1);

      expect(ioSpecification2.behaviour.dataOutputs[0]).to.have.property('id', 'userOutputTo');
      expect(ioSpecification2.behaviour.dataOutputs[0]).to.have.property('name', 'info');

      expect(ioSpecification2.behaviour).to.not.have.property('dataInputs');
    });
  });
});
