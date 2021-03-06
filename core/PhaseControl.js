'use strict'

var _ = require('lodash');

/**
 * Class that controls the current phase and when it needs to go the next.
 */
class PhaseControl {
  constructor(startPhase, scope, log) {
    this.scope = scope || this;
    this.log = log || false;
    this.phases = {};
    this.currentPhase = startPhase;
  }

  add(name, methods) {
    this.phases[name] = _.mapValues(methods, (fn) => fn.bind(this.scope));
  }

  next() {
    var newPhase;

    if (!(newPhase = this.phases[this.currentPhase].condition())) {
      return this.phases[this.currentPhase].correction() || 0;
    }

    if (this.log) {
      console.log(`end ${this.currentPhase}, start ${newPhase}`);
    }
    this.currentPhase = newPhase;

    return this.next();
  }
}

module.exports = PhaseControl;