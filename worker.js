var methods, workload;

var loader = require('./core/lib/loader.js');

methods = {
  init: function (data) {
    workload = workload || new (loader(`./workloads/${data.thread.workload}`))(data);
  }
};

process.on('message', (message) => {
  methods[message.type] && methods[message.type](message.data);
});