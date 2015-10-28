var expect = require('chai').expect;
var LimitQueue = require('../core/LimitQueue');

describe('Limit Queue', () => {
  var limitQueue = new LimitQueue(5);
  [5, 7, 99, 2, 6, 7, 4, 8].forEach((v) => limitQueue.push(v));

  it('Correctly sets the limit', () => {
    expect(limitQueue.limit).to.equal(5);
    expect(limitQueue.data.length).to.equal(5);
  });

  it('Calculates averages', () => {
    expect(limitQueue.average()).to.equal(5.4);
  });

  it('Calculates average on a non-full queue', () => {
    var limitQueue = new LimitQueue(5);
    [5, 7, 9].forEach((v) => limitQueue.push(v));
    expect(limitQueue.average()).to.equal(7);
  })
});