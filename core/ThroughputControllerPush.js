'use strict'

var _ = require('lodash');
var Promise = require('bluebird');
var ThroughputController = require('./ThroughputController');

/**
 * A ThroughputController that just pushes a huge x amount of
 * operations into the database and waits for it to finish.
 * 
 * Simple - effective.
 */
class ThroughputControllerPush extends ThroughputController {

  onThreadMessage(thread, message) {
    super.onThreadMessage(thread, message);
    if (!this.workingThreadsMap || !this.workingThreadsMap[thread.pid]) {
      return;
    }
    if (message === 'finished') {
      this.workingThreadsMap[thread.pid].resolve();
    }
    if (message.type === 'finishedWithError') {
      this.workingThreadsMap[thread.pid].reject(message.err);
    }
  }

  start(options) {
    var started, finished;

    if (!options) {
      options = {
        current: 1,
        cycles: this.parameters.cycles || 1,
        operations: this.parameters.operations
      };
    }

    console.log(`Running cycle ${options.current}/${options.cycles}`);

    this.workingThreadsMap = _.transform(this.threads, (result, thread) => {
      result[thread.pid] = Promise.pending();
    }, {});

    started = Date.now();
    this.threads.forEach((thread) => thread.send({
      type: 'pushOperations',
      data: options.operations / this.threads.length
    }));

    Promise.all(_.map(this.workingThreadsMap, (p) => p.promise))
      .then(() => {
        this.statistics.setResult(options.operations / ((Date.now() - started) / 1000));
      })
      .then(() => {
        if (options.current++ < options.cycles) {
          return Promise.delay(this.parameters.cycleCooldown);
        }
        this.statistics.finish();

        return Promise.reject();
      })
      .then(() => this.start(options))
      .catch(() => setTimeout(() => process.exit(), 1000));
  }
}

module.exports = ThroughputControllerPush;