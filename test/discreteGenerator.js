var expect = require('chai').expect;
var _ = require('lodash');
var DiscreteGenerator = require('../core/DiscreteGenerator');

describe('Discrete Generator', () => {
  var discreteGenerator1, discreteGenerator2;

  discreteGenerator1 = new DiscreteGenerator({
    READ: 0.5,
    WRITE: 0.05,
    SCAN: 0.11
  });

  discreteGenerator2 = new DiscreteGenerator({
    READ: 10,
    WRITE: 2
  });

  it('Creates the correct proportion of values', () => {
    function occurences(generator, name) {
      return _.filter(generator.values, (value) => value === name).length;
    }

    expect(occurences(discreteGenerator1, 'READ')).to.equal(50);
    expect(occurences(discreteGenerator1, 'WRITE')).to.equal(5);
    expect(occurences(discreteGenerator1, 'SCAN')).to.equal(11);
    expect(discreteGenerator1.values.length).to.equal(66);

    expect(occurences(discreteGenerator2, 'READ')).to.equal(10);
    expect(occurences(discreteGenerator2, 'WRITE')).to.equal(2);
    expect(discreteGenerator2.values.length).to.equal(12);
  });

  it('Correctly plays the array of values', () => {
    var length = discreteGenerator1.values.length;

    // Create an array of running discrete generator twice.
    var result = _.map(Array(length * 2), () => discreteGenerator1.next);

    // Both the first part and the second part should be equal to the generated values.
    expect(result.slice(0, length)).to.deep.equal(discreteGenerator1.values);
    expect(result.slice(length)).to.deep.equal(discreteGenerator1.values);
  });
});