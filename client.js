var methods, workload;

methods = {
  init: function (message) {
    workload = workload || new (require(`./workloads/${message.data.thread.workload}.js`))(message.data);
  },
  load: function () {
    workload && workload.executeLoad();
  },
  run: function () {
    workload && workload.executeRun();
  }
};

process.on('message', (message) => {
  methods[message.type] && methods[message.type](message);
});