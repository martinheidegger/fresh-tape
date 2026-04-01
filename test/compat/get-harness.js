'use strict';

var path = require('path');
var spawn = require('child_process').spawn;
var tap = require('tap');

var runChild = function (name, t, next) {
    var child = path.join(__dirname, 'fixtures', name);
    var ps = spawn(process.execPath, [child], {
        cwd: path.join(__dirname, '..', '..')
    });
    ps.stderr.on('data', function (chunk) {
        process.stderr.write(chunk);
    });
    ps.on('close', function (code) {
        t.equal(code, 0, name + ' exits 0');
        next();
    });
};

tap.test('compat: getHarness first call uses stream and exit:false', function (t) {
    runChild('get-harness-text-child.js', t, function () {
        t.end();
    });
});

tap.test('compat: getHarness objectMode pipes object rows', function (t) {
    runChild('get-harness-objectmode-child.js', t, function () {
        t.end();
    });
});
