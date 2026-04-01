'use strict';

var tape = require('../..');
var tap = require('tap');
var concat = require('concat-stream');

tap.test('compat: core assertions', function (tt) {
    tt.plan(1);

    var h = tape.createHarness({ exit: false });
    h.createStream().pipe(concat({ encoding: 'string' }, function (body) {
        var s = String(body);
        tt.ok(s.indexOf('ok ') !== -1 && s.indexOf('# tests ') !== -1, 'assertions emit TAP');
    }));

    h('compat assertions-core', function (t) {
        t.plan(6);
        t.ok(true, 'ok');
        t.equal(1, 1, 'equal');
        t.deepEqual({ a: 1 }, { a: 1 }, 'deepEqual');
        t.throws(function () { throw new Error('x'); }, 'throws');
        t.doesNotThrow(function () {}, 'doesNotThrow');
        t.pass('pass');
    });
});
