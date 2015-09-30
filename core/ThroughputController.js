"use strict"

var _ = require('lodash');
var settings = require('../settings.json').throughput;

/**
 * This class is used to control the number of operations per second
 * for all threads. The algorithm adjusts the throughput towards the
 * goalLatency and emits the new number of operations per second.
 */
class ThroughputController {
	constructor(threads) {
		this.threads = threads;
		this.reset();
		this.initThreads();
		this.initThroughputEmitter();
	}

	reset() {
		this.operationsPerSecond = settings.startOperationsPerSecond;
		this.deltaOperationsPerSecond = settings.startDeltaOperationsPerSecond;
		this.latencies = [];
	}

	// Start listening to all threads.
	initThreads() {
		this.threads.forEach((thread) => thread.on('message', this.onThreadMessage));
	}

	onThreadMessage(message) {
		if (message.type === 'latency') {
			console.log('latency', message);
			this.setLatency(message.value);
		}
	}

	// Collect latencies for roughly 1 second and do its magic.
	initThroughputEmitter() {
		setInterval(() => {
			var currentLatency = _.sum(this.latencies) / this.latencies.length;

			// console.log(`current avg latency ${currentLatency}`);

			// Start fresh on next iteration.
			this.latencies = [];

			// If average is 0 or NaN (in case length is 0) the threads havent started yet.
			if (!currentLatency) {
				return;
			}

			// When currentLatency is under the targetLatency multiply by 4 to quickly increase latency.
			// Otherwise slowly bring the latency back down by dividing by 2.
			// A better algorithm would be to use the PIDController. (npm: node-pid-controller)
			if (currentLatency < settings.targetLatency) {
				this.deltaOperationsPerSecond = Math.abs(this.deltaOperationsPerSecond) << 2;
			} else {
				this.deltaOperationsPerSecond = -(Math.abs(this.deltaOperationsPerSecond) >> 1);
			}

			// If delta is 0, reset to 1, otherwise there is nothing to bitshift.
			this.deltaOperationsPerSecond = this.deltaOperationsPerSecond || 1;

			// Update operationsPerSecond and send out data.
			this.operationsPerSecond += this.deltaOperationsPerSecond;
			this.emitOperationsPerSecond();
		}, settings.setInterval);
	}

	// Measure average latency for the last second.
	setLatency(latency) {
		this.latencies.push(~~latency.value);
	}

	emitOperationsPerSecond() {
		this.threads.forEach((thread) => thread.send({
			type: 'setOperationsPerSecond',
			data: this.operationsPerSecond
		}));
	}
}

module.exports = ThroughputController;