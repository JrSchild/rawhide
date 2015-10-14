var fs = require('fs');
var path = require('path');
var name = require('./package.json').name;

/**
 * This script symlinks itself to the node_modules folder.
 * The framework should be able to run globally. With this
 * symlink development can be done inside a single project.
 */
var from = process.cwd();
var to = `${from}/node_modules/${name}`;

createSymlink(from, to);

// Cherry picked from https://github.com/npm/npm/blob/master/lib/utils/link.js
function createSymlink(from, to) {
  var target;

  to = path.resolve(to);
  from = target = path.resolve(from);

  if (process.platform !== 'win32') {

    // junctions on windows must be absolute
    target = path.relative(path.dirname(to), from);

    // if there is no folder in common, then it will be much
    // longer, and using a relative link is dumb.
    if (target.length >= from.length) {
      target = from;
    }
  }

  if (fs.existsSync(to)) {
    fs.unlinkSync(to);
  }
  fs.symlinkSync(from, to, 'junction');
}