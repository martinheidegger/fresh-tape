'use strict';

var tap = require('tap');
var tape = require('../');
var Writable = require('readable-stream').Writable;

tap.test('test.comment() in objectMode', function (assert) {
    var objects = [];
    tape.createStream({ objectMode: true })
        .pipe(new Writable({
            objectMode: true,
            write: function (chunk, _, cb) {
                objects.push(chunk);
                cb();
            }
        }))
        .on('finish', function () {
            assert.deepEqual(objects, [
                {
                    type: 'test',
                    name: 'test.comment',
                    id: 0,
                    skip: false,
                    todo: false
                },
                'message',
                { type: 'end', test: 0 }
            ]);
            assert.end();
        })
        .on('error', function (e) {
            assert.fail(e);
        });

    tape('test.comment', function (test) {
        test.comment('message');
        test.end();
    });
});
