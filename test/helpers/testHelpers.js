import BpmnModdle from 'bpmn-moddle';

export default {
  moddleContext,
};

function moddleContext(source, options = {}) {
  const moddleOptions = options.extensions && Object.keys(options.extensions).reduce((result, ext) => {
    result[ext] = options.extensions[ext].moddleOptions;
    return result;
  }, {});

  const bpmnModdle = new BpmnModdle(moddleOptions);

  return new Promise((resolve, reject) => {
    bpmnModdle.fromXML(Buffer.isBuffer(source) ? source.toString() : source.trim(), (err, definitions, moddleCtx) => {
      if (err) return reject(err);
      resolve(moddleCtx);
    });
  });
}
