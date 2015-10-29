var methods, workload;

var loader = require('./core/lib/loader.js');

methods = {
  init: function (message) {
    workload = workload || new (loader(`./workloads/${message.data.thread.workload}`))(message.data);
  }
};

process.on('message', (message) => {
  methods[message.type] && methods[message.type](message);
});