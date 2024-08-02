import BpmnModdle from 'bpmn-moddle';
import fs from 'fs';

const camundaExtensions = {};

export default {
  moddleContext,
  getCamundaExtension,
  getJsExtension,
};

function moddleContext(source, options) {
  const bpmnModdle = new BpmnModdle(options);
  return bpmnModdle.fromXML(Buffer.isBuffer(source) ? source.toString() : source.trim());
}

function getCamundaExtension(version = 'camunda-bpmn-moddle') {
  let content = camundaExtensions[version];
  if (!content) {
    content = camundaExtensions[version] = fs.readFileSync(`./node_modules/${version}/resources/camunda.json`);
  }
  return JSON.parse(content);
}

function getJsExtension() {
  const content = fs.readFileSync('./test/resources/js-bpmn-moddle.json');
  return JSON.parse(content);
}
