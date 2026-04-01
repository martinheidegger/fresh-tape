'use strict';

var tape = require('../..');
var tap = require('tap');
var concat = require('concat-stream');

tap.test('compat: capture / captureFn / intercept / assertion', function (tt) {
    tt.plan(1);

    var h = tape.createHarness({ exit: false });
    h.createStream().pipe(concat({ encoding: 'string' }, function (body) {
        var s = String(body);
        tt.ok(s.indexOf('ok ') !== -1 && s.indexOf('# tests ') !== -1, 'extensions emit TAP');
    }));

    h('compat api-extensions', function (t) {
        var sentinel = { s: true };
        var o = { foo: sentinel };
        var results = t.capture(o, 'foo', function () { return sentinel; });
        o.foo(1);
        var calls = results();
        t.ok(Array.isArray(calls) && calls.length === 1, 'capture: results');

        var inc = function (n) { return n + 1; };
        var wrapped = t.captureFn(inc);
        t.equal(wrapped(2), 3, 'captureFn: return');
        t.ok(Array.isArray(wrapped.calls) && wrapped.calls.length === 1, 'captureFn: calls');

        var io = { n: 0 };
        var ires = t.intercept(io, 'n', { value: 0, writable: true });
        t.equal(io.n, 0, 'intercept: get');
        io.n = 7;
        t.ok(Array.isArray(ires()), 'intercept: results');

        var assertMsg = function (msg) {
            /* eslint no-invalid-this: 0 */
            this.pass(msg || 'custom');
        };
        t.assertion(assertMsg, 'assertion-arg');

        t.end();
    });
});
