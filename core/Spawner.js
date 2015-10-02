"use strict"

var fork = require('child_process').fork;
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var ThroughputController = require('./ThroughputController');

class Spawner {
  constructor(settings) {
    this.settings = settings;
    this.threads = [];
    this.threadsConnected = [];
    this.threadsLoaded = [];
    this.spawnThreads();
    this.throughputController = new ThroughputController(this.threads);

    Promise.all(this.threadsConnected).then(() => console.log('All threads are connected.'));
    Promise.all(this.threadsLoaded).then(() => console.log('All threads are loaded.'));

    Promise.all(this.threadsConnected).then(() => this.sendToThreads(!settings.skipLoadingPhase ? 'load' : 'run'));
    Promise.all(this.threadsLoaded).then(() => !settings.skipLoadingPhase && this.sendToThreads('run'));
  }

  spawnThreads() {
    this.settings.threads.forEach((thread) => {
      _.times(thread.multiply || 1, this.spawnThread.bind(this, thread));
    });
  }

  spawnThread(thread) {
    var resolverConnected = Promise.pending();
    var resolverLoaded = Promise.pending();
    var process = fork(path.resolve(__dirname, '../worker.js'));

    // TODO: Imporove error handling.
    process.on('error', (error) => {});

    // When process is connected
    process.on('message', (message) => {
      if (message.type === 'connected') {
        resolverConnected.resolve();
      } else if (message.type === 'finishedLoading') {
        resolverLoaded.resolve();
      } else if (message.type === 'connectionError') {
        resolverConnected.reject('NotConnectedError');
        resolverLoaded.reject('NotConnectedError');
      }
    });

    // Initialize the client with settings and add to list of threads.
    this.sendToProcess('init', {
      thread: thread,
      settings: this.settings
    })(process);
    this.threads.push(process);
    this.threadsConnected.push(resolverConnected.promise);
    this.threadsLoaded.push(resolverLoaded.promise);
  }

  sendToThreads(type, data) {
    this.threads.forEach(this.sendToProcess(type, data));
  }

  sendToProcess(type, data) {
    var command = _.defaults({type, data}, {data: null});

    return (process) => process.send(command);
  }
}

module.exports = Spawner;