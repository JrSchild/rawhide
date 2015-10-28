'use strict'

var express = require('express');
var socket = require('socket.io');
var _ = require('lodash');

/**
 * Creates an epxress app and pipes through data realtime to the browser.
 */
class WebClient {
  constructor(spawner) {
    this.spawner = spawner;
    this.app = express();
    this.app.use(express.static(`${__dirname}/../static`));

    this.app.get('/api/start', (req, res) => {
      if (this.spawner.start()) {
        console.log('Started Spawner.');
      }
      res.status(204);
    });

    this.server = this.app.listen(1337, () => {
      console.log('Express is listening to http://localhost:1337');
    });

    this.io = socket.listen(this.server);

    this.spawner.statistics.on('latency', (latency) => {
      this.io.sockets.emit('latency', latency);
    });
    this.spawner.statistics.on('queueCount', (queueCount) => {
      this.io.sockets.emit('queueCount', queueCount);
    });
    this.spawner.statistics.on('executedOperationsPerSecond', (executedOperationsPerSecond) => {
      this.io.sockets.emit('executedOperationsPerSecond', executedOperationsPerSecond);
    });
    this.spawner.throughputController.on('operationsPerSecond', (operationsPerSecond) => {
      this.io.sockets.emit('operationsPerSecond', [Date.now(), operationsPerSecond]);
    });
  }
}

module.exports = WebClient;