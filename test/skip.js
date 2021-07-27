'use strict';

var test = require('../');

var concat = require('concat-stream');
var tap = require('tap');
var Writable = require('readable-stream').Writable;

// Because this test passing depends on a failure,
// we must direct the failing output of the inner test
var mockSink = new Writable({
    write: function (_, _2, cb) {
        cb();
    }
});
test.createStream().pipe(mockSink);

tap.test('test SKIP comment', function (assert) {
    assert.plan(1);

    var verify = function (output) {
        assert.equal(output.toString('utf8'), [
            'TAP version 13',
            '# SKIP skipped',
            '',
            '1..0',
            '# tests 0',
            '# pass  0',
            '',
            '# ok',
            ''
        ].join('\n'));
    };

    var tapeTest = test.createHarness();
    tapeTest.createStream().pipe(concat(verify));
    tapeTest('skipped', { skip: true }, function (t) {
        t.end();
    });
});

test('skip this', { skip: true }, function (t) {
    t.fail('this should not even run');
    t.end();
});

test.skip('skip this too', function (t) {
    t.fail('this should not even run');
    t.end();
});

test('skip subtest', function (t) {
    t.test('skip this', { skip: true }, function (st) {
        st.fail('this should not even run');
        st.end();
    });
    t.end();
});

// vim: set softtabstop=4 shiftwidth=4:
