'use strict';

/* eslint-disable no-process-exit -- subprocess asserts exit codes */

var concat = require('concat-stream');
var tape = require('../../..');

var sink = concat({ encoding: 'string' }, function (body) {
    var s = String(body);
    if (s.indexOf('TAP version') === -1) {
        process.exit(1);
    }
    if (s.indexOf('getHarness text') === -1) {
        process.exit(2);
    }
    if (s.indexOf('ok ') === -1) {
        process.exit(3);
    }
    if (s.indexOf('# tests') === -1) {
        process.exit(4);
    }
    process.exit(0);
});

tape.getHarness({ stream: sink, exit: false });
tape('getHarness text', function (t) {
    t.plan(1);
    t.pass('custom stream');
});
