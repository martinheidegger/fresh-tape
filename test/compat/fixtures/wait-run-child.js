'use strict';

var tape = require('../../..');

tape.wait();
tape('compat wait-run child', function (t) {
    t.plan(1);
    t.pass('deferred harness');
});
tape.run();
