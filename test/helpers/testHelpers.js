import BpmnModdle from 'bpmn-moddle';

export default {
  moddleContext,
};

function moddleContext(source, options) {
  const bpmnModdle = new BpmnModdle(options);

  return new Promise((resolve, reject) => {
    bpmnModdle.fromXML(Buffer.isBuffer(source) ? source.toString() : source.trim(), (err, definitions, moddleCtx) => {
      if (err) return reject(err);
      resolve(moddleCtx);
    });
  });
}
