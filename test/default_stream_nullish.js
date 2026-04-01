'use strict';

/**
 * Regression for upstream tape eff3725: default_stream must accept nullish / odd
 * writes without throwing (public entry point). fresh-tape uses Writable instead of through.
 */

var tap = require('tap');
var createDefaultStream = require('../lib/default_stream');

tap.test('default_stream: nullish and primitive writes flush without error', function (t) {
    t.plan(1);

    var stream = createDefaultStream();
    var errors = [];
    stream.on('error', function (e) {
        errors.push(e);
    });

    stream.write(null, function () {
        stream.write(undefined, function () {
            stream.write(42, function () {
                stream.write(Buffer.from('line\n'), function () {
                    stream.end();
                });
            });
        });
    });

    stream.on('finish', function () {
        t.same(errors, []);
    });
});
