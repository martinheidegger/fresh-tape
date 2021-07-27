'use strict';

var tap = require('tap');
var tape = require('../');
var forEach = require('for-each');
var Writable = require('readable-stream').Writable;

tap.test('object results', function (assert) {
    var objects = [];
    tape.createStream({ objectMode: true })
        .pipe(new Writable({
            objectMode: true,
            write: function (obj, _, cb) {
                objects.push(obj);
                cb();
            }
        }))
        .on('finish', function () {
            var todos = 0;
            var skips = 0;
            var testIds = [];
            var endIds = [];
            var asserts = 0;

            assert.equal(objects.length, 13);

            forEach(objects, function (object) {
                if (object.type === 'assert') {
                    asserts++;
                } else if (object.type === 'test') {
                    testIds.push(object.id);

                    if (object.skip) {
                        skips++;
                    } else if (object.todo) {
                        todos++;
                    }
                } else if (object.type === 'end') {
                    endIds.push(object.text);
                    // test object should exist
                    assert.notEqual(testIds.indexOf(object.test), -1);
                }
            });

            assert.equal(asserts, 5);
            assert.equal(skips, 1);
            assert.equal(todos, 2);
            assert.equal(testIds.length, endIds.length);
            assert.end();
        });

    tape('parent', function (t1) {
        t1.equal(true, true);
        t1.test('child1', { skip: true }, function (t2) {
            t2.equal(true, true);
            t2.equal(true, false);
            t2.end();
        });
        t1.test('child2', { todo: true }, function (t3) {
            t3.equal(true, false);
            t3.equal(true, true);
            t3.end();
        });
        t1.test('child3', { todo: true });
        t1.equal(true, true);
        t1.equal(true, true);
        t1.end();
    });
});
