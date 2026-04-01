'use strict';

var path = require('path');
var spawn = require('child_process').spawn;
var tap = require('tap');

tap.test('compat: tape.wait then tape.run wires default stream', function (t) {
    var child = path.join(__dirname, 'fixtures', 'wait-run-child.js');
    var ps = spawn(process.execPath, [child], {
        cwd: path.join(__dirname, '..', '..')
    });
    var out = '';
    ps.stdout.setEncoding('utf8');
    ps.stdout.on('data', function (chunk) {
        out += chunk;
    });
    ps.stderr.on('data', function (chunk) {
        process.stderr.write(chunk);
    });
    ps.on('close', function (code) {
        t.equal(code, 0, 'child exits 0');
        t.ok(out.indexOf('TAP version') !== -1, 'TAP header');
        t.ok(out.indexOf('ok ') !== -1, 'assertion line');
        t.ok(out.indexOf('# tests') !== -1, 'summary');
        t.end();
    });
});
