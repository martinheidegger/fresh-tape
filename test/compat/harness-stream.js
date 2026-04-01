'use strict';

var tape = require('../..');
var tap = require('tap');
var concat = require('concat-stream');

tap.test('compat: createHarness + text TAP stream', function (tt) {
    tt.plan(1);

    var h = tape.createHarness({ exit: false });
    h.createStream().pipe(concat({ encoding: 'string' }, function (body) {
        var s = String(body);
        var shapeOk = s.indexOf('TAP version') !== -1
            && (s.indexOf('ok ') !== -1 || s.indexOf('not ok ') !== -1)
            && s.indexOf('# tests ') !== -1
            && (s.indexOf('# ok') !== -1 || s.indexOf('# fail') !== -1);
        tt.ok(shapeOk, 'TAP stream has version, assertion, summary, and final status');
    }));

    h('compat harness-stream', function (t) {
        t.plan(1);
        t.ok(true, 'runs');
    });
});
