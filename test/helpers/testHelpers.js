import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import BpmnModdle from 'bpmn-moddle';

const nodeRequire = createRequire(fileURLToPath(import.meta.url));

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
    content = camundaExtensions[version] = nodeRequire(`${version}/resources/camunda.json`);
  }
  return content;
}

function getJsExtension() {
  return nodeRequire('../resources/js-bpmn-moddle.json');
}
