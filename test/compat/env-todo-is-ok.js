'use strict';

var tape = require('../..');
var tap = require('tap');
var concat = require('concat-stream');
var mockProperty = require('mock-property');

tap.test('compat: TODO_IS_OK=1 marks todo failures as ok in TAP', function (tt) {
    tt.plan(1);

    tt.teardown(mockProperty(process.env, 'TODO_IS_OK', { value: '1' }));

    var h = tape.createHarness({ exit: false });
    h.createStream().pipe(concat({ encoding: 'string' }, function (body) {
        var s = String(body);
        tt.ok(s.indexOf('ok 2') !== -1 && s.indexOf('# TODO') !== -1, 'todo failure line is ok with TODO');
    }));

    h('compat todo-is-ok', function (t) {
        t.plan(2);
        t.pass('one');
        t.fail('todo fail', { todo: true });
    });
});
