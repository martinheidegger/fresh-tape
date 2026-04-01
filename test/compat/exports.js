'use strict';

var tape = require('../..');
var tap = require('tap');

tap.test('compat: public exports surface', function (t) {
    t.equal(typeof tape, 'function', 'default export');
    t.equal(typeof tape.createHarness, 'function', 'createHarness');
    t.equal(typeof tape.Test, 'function', 'Test');
    t.equal(tape.test, tape, 'tape.test aliases default export');
    t.equal(typeof tape.test.skip, 'function', 'tape.test.skip');
    t.equal(typeof tape.only, 'function', 'only');
    t.equal(typeof tape.skip, 'function', 'skip');
    t.equal(typeof tape.onFinish, 'function', 'onFinish');
    t.equal(typeof tape.onFailure, 'function', 'onFailure');
    t.equal(typeof tape.createStream, 'function', 'createStream');
    t.equal(typeof tape.wait, 'function', 'wait');
    t.equal(typeof tape.run, 'function', 'run');
    t.equal(typeof tape.getHarness, 'function', 'getHarness');
    t.end();
});
