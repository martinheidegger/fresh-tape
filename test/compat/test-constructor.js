'use strict';

var tape = require('../..');
var tap = require('tap');
var concat = require('concat-stream');

tap.test('compat: new tape.Test registers when pushed like harness', function (tt) {
    tt.plan(1);

    var h = tape.createHarness();
    h.createStream().pipe(concat({ encoding: 'string' }, function (body) {
        var s = String(body);
        tt.ok(
            s.indexOf('constructed case') !== -1 && s.indexOf('ok ') !== -1,
            'constructed Test runs'
        );
    }));

    var inst = new tape.Test('constructed case', function (t) {
        t.plan(1);
        t.pass('constructed');
    });

    h._tests.push(inst);
    h._results.push(inst);
});
