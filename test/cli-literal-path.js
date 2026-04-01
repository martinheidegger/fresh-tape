'use strict';

/**
 * Phase C: non-glob arguments are passed through as literal paths (glob.hasMagic),
 * then resolved with require.resolve — distinct from glob expansion.
 */

var tap = require('tap');
var path = require('path');
var execFile = require('child_process').execFile;

var tapeBin = path.join(__dirname, '../bin/fresh-tape');

tap.test('runs a single literal test file path (no glob metacharacters)', function (tt) {
    tt.plan(2);

    execFile(process.execPath, [tapeBin, 'compat/smoke.js'], { cwd: __dirname }, function (err, stdout) {
        tt.equal(err, null);
        tt.match(stdout.toString('utf8'), /compat: smoke — loads and exports harness/);
    });
});
