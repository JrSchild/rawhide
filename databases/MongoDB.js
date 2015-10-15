'use strict'

var Q = require('q');
var co = require('co');
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
var Docker = require('dockerode');
var DBSettings = require('../database.json').MongoDB;

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
    var host = this.parameters.settings.docker ? this.parameters.settings.docker.host : DBSettings.host;

    MongoClient.connect(`mongodb://${host}:${DBSettings.port}/${DBSettings.database}`, (err, db) => {
      if (err) return cb && cb(err);

      db.on('close', (error) => console.error(`Connection to db closed! ${error}`))
      cb && cb(null, this.db = db);
    });
  }

  getIndexMemory() {}

  getDiskSize() {}

  // Methods to start and destroy the database docker container.
  static setUpDockerContainer() {
    var timeout, docker = new Docker();

    timeout = setTimeout(() => {
      throw new Error('Docker Remote API is unresponsive. Please reset the docker the environment.');
    }, 8000);

    // Run a generator to kill the previous mongo instance and start a new one.
    return co(function *() {
      var containers, container;

      // Retrieve a list of current containers and kill mongodb.
      containers = yield Q.ninvoke(docker, 'listContainers');
      yield MongoDB.stopContainers(docker, containers, '/mongodb');

      // Create and start a new mongodb container.
      container = yield Q.ninvoke(docker, 'createContainer', createOptions);
      yield Q.ninvoke(container, 'start', startOptions);

      clearTimeout(timeout);

      return docker.modem;
    }).catch((err) => {
      clearTimeout(timeout);
      throw err;
    });
  }

  static tearDownDockerContainer() {
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