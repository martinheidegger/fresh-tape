'use strict';

var tap = require('tap');
var tape = require('../').createHarness();
var Writable = require('readable-stream').Writable;

// Because this test passing depends on a failure, we must direct the failing output of the inner test
var mockSink = new Writable({
    write: function (_, _2, cb) {
        cb();
    }
});
tape.createStream().pipe(mockSink);

tap.test('on failure', { timeout: 1000 }, function (tt) {
    tt.plan(1);

    tape('dummy test', function (t) {
        t.fail();
        t.end();
    });

    tape.onFailure(function () {
        tt.pass('tape ended');
    });
});
