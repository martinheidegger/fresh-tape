'use strict';

/**
 * Minimal compatibility suite: ensures the package loads and matches basic tape-style API.
 */

var tape = require('../..');
var tap = require('tap');

tap.test('compat: smoke — loads and exports harness', function (t) {
    t.equal(typeof tape, 'function', 'default export is a function');
    t.equal(typeof tape.createHarness, 'function', 'createHarness');
    t.equal(typeof tape.Test, 'function', 'Test');
    t.end();
});
