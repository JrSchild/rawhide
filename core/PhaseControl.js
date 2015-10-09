"use strict"

/**
 * Class that controls the current phase and when it needs to go the next.
 */
class PhaseControl {
	constructor(startPhase, data) {
		this.data = data;
		this.phases = {};
		this.currentPhase = startPhase;
	}

	add(name, methods) {
		this.phases[name] = methods;
	}

	next() {
	  var newPhase;

	  if (!(newPhase = this.phases[this.currentPhase].condition())) {
	    return this.phases[this.currentPhase].correction();
	  }

	  this.currentPhase = newPhase;

	  return next();
	}
}

module.exports = PhaseControl;