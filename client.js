var workload;

process.on('message', (message) => {
  if (message.type === 'init' && !workload) {
    workload = new (require(`./workloads/${message.data.thread.workload}.js`))(message.data);
  } else if (message.type === 'load' && workload) {
    workload.executeLoad();
  }
});