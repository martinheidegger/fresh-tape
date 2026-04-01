'use strict';

var tape = require('../..');
var tap = require('tap');
var concat = require('concat-stream');

tap.test('compat: createHarness close flushes TAP summary when autoclose is off', function (tt) {
    tt.plan(1);

    var h = tape.createHarness({ autoclose: false });
    h.createStream().pipe(concat({ encoding: 'string' }, function (body) {
        var s = String(body);
        tt.ok(
            s.indexOf('TAP version') !== -1
            && s.indexOf('# tests') !== -1
            && s.indexOf('# ok') !== -1,
            'close() emits TAP summary'
        );
    }));

    h('harness manual close', function (t) {
        t.plan(1);
        t.pass('runs');
    });

    h.onFinish(function () {
        h.close();
    });
});
