'use strict';

/* eslint-disable no-process-exit -- subprocess asserts exit codes */

var Writable = require('@leichtgewicht/readable-stream').Writable;
var tape = require('../../..');

var sawAssert = false;
var w = new Writable({
    objectMode: true,
    write: function (chunk, enc, cb) {
        if (chunk && chunk.type === 'assert') {
            sawAssert = true;
        }
        cb();
    }
});

tape.getHarness({ stream: w, objectMode: true, exit: false });
tape('getHarness objectMode', function (t) {
    t.plan(1);
    t.pass('row');
});
tape.onFinish(function () {
    process.exit(sawAssert ? 0 : 1);
});
