'use strict';

var path = require('path');
var tap = require('tap');

var root = path.join(__dirname, '..', '..');
var Test = require(path.join(root, 'lib', 'test.js'));
var Results = require(path.join(root, 'lib', 'results.js'));
var defaultStream = require(path.join(root, 'lib', 'default_stream.js'));
var pkg = require(path.join(root, 'package.json'));

tap.test('compat: deep entrypoints (same files as package exports)', function (t) {
    t.equal(typeof Test, 'function', 'lib/test');
    t.equal(typeof Results, 'function', 'lib/results');
    t.equal(typeof defaultStream, 'function', 'lib/default_stream');
    t.equal(pkg.name, 'fresh-tape', 'package.json via path');
    t.end();
});
