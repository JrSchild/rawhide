var expect = require('chai').expect;
var _ = require('lodash');
var LimitCounter = require('../core/LimitCounter');

describe('Limit Counter', () => {

  it('Adds numbers and increases the counter', () => {
    var cbs, limitCounter;

    limitCounter = new LimitCounter(5, (err) => {});
    cbs = _.map(Array(3), () => {
      return limitCounter.add(1);
    });
    expect(limitCounter.isFinished).to.equal(false);
    expect(limitCounter.inQueue).to.equal(3);
    _.each(cbs, (cb) => cb());
    expect(limitCounter.inQueue).to.equal(0);
  });

  it('Successfully exits with errors', (cb) => {
    limitCounter = new LimitCounter(5, (err) => {
      expect(err).to.equal('Error');
      cb();
    });
    limitCounter.add()('Error');
  });

  // it('Can only execute each callback handler once', () => {});
  // it('Is not possible to add more numbers when the limit is reached', () => {});
  // it('Defaults adding with the number one.', () => {});
});