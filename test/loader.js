var expect = require('chai').expect;

// Change the current working directory when loading the loader so it thinks
// it is operating from a different directory. After it is loaded change it
// back so it doesn't affect other tests. Beacuse this loading as synchronous
// it won't mess anything up.
var cwd = process.cwd();
process.chdir('./test/data');
var loader = require('../core/lib/loader');
process.chdir(cwd);

describe('Dynamic module loader', () => {
  it('Loads files from the first choice', () => {
    expect(loader('parameters.json')).to.deep.equal({foo: 'bar'});
  });

  it('Loads files from the second choice', () => {
    expect(!!loader('settings.json')).to.equal(true);
  });

  it('Throws an error when the file is not found', () => {
    var error;

    try {
      loader('thisdoesntexist.js');
    } catch (_error) { error = _error }

    expect(error.code).to.equal('MODULE_NOT_FOUND');
  });
});