'use strict';

var tape = require('../');
var tap = require('tap');
var Writable = require('readable-stream').Writable;

// Because this test passing depends on a failure,
// we must direct the failing output of the inner test
var mockSink = new Writable({
    write: function (_, _2, cb) {
        cb();
    }
});
tape.createStream().pipe(mockSink);

tap.test('main harness object is exposed', function (assert) {

    assert.equal(typeof tape.getHarness, 'function', 'tape.getHarness is a function');

    assert.equal(tape.getHarness()._results.pass, 0);

    assert.end();

});
