"use strict"

class DiscreteGenerator {
  constructor(proportions) {

    // Values are a list of arrays: [name, proportion]
    this.values = [];
    this.valuesLength = 0;

    // Sum the total of all proportions to calculate aspect ratio.
    this.sum = 0;

    if (proportions) {
      this.addValues(proportions);
    }
  }

  get next() {
    var divider = Math.random();

    for (var i = 0, l = this.valuesLength; i < l; i++) {
      let proportion = this.values[i][1] / this.sum;

      if (divider < proportion) {
        return this.values[i][0];
      }

      divider -= proportion;
    }

    throw new Error('ThisShouldNotBeExecutedError');
  }

  add(name, proportion) {
    this.values.push([name, proportion]);
    this.sum += proportion;
    this.valuesLength++;
  }

  addValues(values) {
    Object.keys(values).forEach((key) => this.add(key, values[key]));
  }
}

module.exports = DiscreteGenerator;