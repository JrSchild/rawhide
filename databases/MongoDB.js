"use strict"

var Q = require('q');
var co = require('co');
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
var Docker = require('dockerode');
var settings = require('../database.json').MongoDB;

const createOptions = {
  Image: 'mongo',
  name: 'mongodb',
  Cmd: ['--storageEngine=wiredTiger'],
  ExposedPorts: { '27017/tcp': {} }
};
const startOptions = {
  Binds: ['/db:/data/db'],
  PortBindings: { '27017/tcp': [{ HostPort: '27017' }] },
  RestartPolicy: { Name: 'always' }
};

/**
 * Connector class for MongoDB. Can also ask for index memory and stuff like that.
 * Methods are all generic, they do not depend on Model implementation.
 */
class MongoDB {
  connect(cb, overwrites) {
    MongoClient.connect(`mongodb://${this.parameters.settings.docker.host}:${settings.port}/${settings.database}`, (err, db) => {
      cb && cb(err, this.db = db);
    });
  }

  getIndexMemory() {}

  getDiskSize() {}

  // Methods to start and destroy the database docker container.
  static setUp() {
    var docker = new Docker();

    // Run a generator to kill the previous mongo instance and start a new one.
    return co(function *() {
      var containers, container;

      // Retrieve a list of current containers and kill mongodb.
      containers = yield Q.ninvoke(docker, 'listContainers');
      yield MongoDB.stopContainers(docker, containers, '/mongodb');

      // Create and start a new mongodb container.
      container = yield Q.ninvoke(docker, 'createContainer', createOptions);
      yield Q.ninvoke(container, 'start', startOptions);
    }).then(() => docker.modem);
  }

  static tearDown() {
    throw new Error('NotYetImplemented')
  }

  static stopContainers(docker, containers, name) {
    return _(containers)
      .filter((container) => container.Names.indexOf(name) >= 0)
      .map((container) => {
        container = docker.getContainer(container.Id);

        return Q.ninvoke(container, 'remove', {
          force: true
        });
      })
      .value();
  }
}

module.exports = MongoDB;