var path = require('path');
var firstDir = process.cwd();
var secondDir = path.resolve(__dirname, '../../');

/**
 * A simple loader that first looks in the current working directory
 * and then in the rawhide framework.
 * TODO: The merge does a deep merge of JavaScript objects
 * with automatic caching. Useful for parameters and settings.
 */
module.exports = (filename, merge) => {
  try {
    return require(path.resolve(firstDir, filename));
  } catch (e) {}

  return require(path.resolve(secondDir, filename));
};