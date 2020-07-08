import factory from './helpers/factory';
import testHelpers from './helpers/testHelpers';
import types from './helpers/types';
import camunda from 'camunda-bpmn-moddle/resources/camunda';

import {default as Serializer, TypeResolver, deserialize} from '../index';

const typeResolver = TypeResolver(types);

describe('scripts', () => {
  describe('a process with inline, extension elements with scripts, extension external resource, and flow condition scripts, and a flow expression', () => {
    let moddleContext;
    before('load with extension', async () => {
      const source = factory.resource('scripts.bpmn');
      moddleContext = await testHelpers.moddleContext(source, {
        camunda,
      });
    });

    it('getScripts() extracts known scripts', async () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const scripts = serializer.getScripts();
      expect(scripts.length).to.equal(6);
    });

    it('extracts scripts with name, parent, and script format', async () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const scripts = serializer.getScripts();

      for (const script of scripts) {
        expect(script, script.id).to.have.property('name');
        expect(script, script.id).to.have.property('parent');
        expect(script.parent, script.id).to.have.property('id');
        expect(script.parent, script.id).to.have.property('type');
        expect(script, script.id).to.have.property('script').that.is.an('object');
        expect(script.script, script.id).to.have.property('scriptFormat');
      }
    });

    it('deserialized also returns scripts', () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const scripts = serializer.getScripts();

      const deserialized = deserialize(JSON.parse(serializer.serialize()), typeResolver);

      expect(scripts).to.deep.equal(deserialized.getScripts());
    });

    it('flow conditions have condition type', async () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const scripts = serializer.getScripts('bpmn:SequenceFlow');
      expect(scripts).to.have.length(3);

      for (const script of scripts) {
        expect(script.script, script.id).to.have.property('type').that.is.ok;
      }
    });

    it('script task with external resource has resource but lacks body', async () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const script = serializer.getScripts('bpmn:ScriptTask').find((s) => s.parent.id === 'script-resource');

      expect(script.script.body, 'body').to.not.be.ok;
      expect(script.script.resource, 'resource').to.be.ok;
    });

    it('flow with external resource script has resource but lacks body', async () => {
      const serializer = Serializer(moddleContext, typeResolver);
      const script = serializer.getScripts('bpmn:SequenceFlow').find((s) => s.parent.id === 'to-resource');

      expect(script.script.body, 'body').to.not.be.ok;
      expect(script.script.resource, 'resource').to.be.ok;
    });

    it('extension elements scripts are added with extension function', async () => {
      const serializer = Serializer(moddleContext, typeResolver, extend);
      const [, input, output] = serializer.getScriptsByElementId('script-js');

      expect(input).to.have.property('name', 'parameter/scriptInline');
      expect(input).to.have.property('parent').that.deep.equal({
        id: 'script-js',
        type: 'bpmn:ScriptTask',
      });
      expect(input).to.have.property('script').that.deep.equal({
        id: 'parameter_scriptInline',
        type: 'camunda:InputParameter',
        scriptFormat: 'javascript',
        body: 'content/2;',
      });
      expect(output).to.have.property('name', 'parameter/scriptExternal');
      expect(output).to.have.property('parent').that.deep.equal({
        id: 'script-js',
        type: 'bpmn:ScriptTask',
      });
      expect(output).to.have.property('script').that.deep.equal({
        id: 'parameter_scriptExternal',
        type: 'camunda:OutputParameter',
        scriptFormat: 'javascript',
        resource: '/script/extractOutput.js',
      });

      function extend(element, {addScript}) {
        const {extensionElements} = element;
        if (!extensionElements || !extensionElements.values) return;

        for (const ext of extensionElements.values) {
          if (ext.inputParameters) ext.inputParameters.forEach(addParameterScript);
          if (ext.outputParameters) ext.outputParameters.forEach(addParameterScript);
        }

        function addParameterScript(parm) {
          const {$type: parmType, name, definition} = parm;
          if (!definition || !definition.scriptFormat) return;
          addScript(`parameter/${name}`, {
            id: `parameter_${name}`,
            type: parmType,
            scriptFormat: definition.scriptFormat,
            body: definition.value,
            resource: definition.resource,
          });
        }
      }
    });
  });
});
