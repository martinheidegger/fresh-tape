'use strict';

var tap = require('tap');
var path = require('path');
var execFile = require('child_process').execFile;

var stripFullStack = require('./common').stripFullStack;
var stripDeprecations = require('./common').stripDeprecations;

var tapeBin = path.join(__dirname, '../bin/fresh-tape');

var expectedStackTraceBug = (/^3\.[012]\.\d+$/).test(process.versions.node); // https://github.com/nodejs/node/issues/2581

tap.test(
    'should throw error when --strict is passed via cli and no files are found',
    { todo: expectedStackTraceBug ? 'Fails on these node versions' : false },
    function (tt) {
        tt.plan(3);

        execFile(process.execPath, [tapeBin, '--strict', 'no*files*found'], { cwd: path.join(__dirname) }, function (err, stdout, stderr) {
            tt.same(stdout.toString('utf8'), '');
            tt.match(stripFullStack(stderr.toString('utf8')).join('\n'), /^No test files found!\n$/);
            tt.equal(err && err.code, 127);
        });
    }
);

tap.test(
    'should not throw error when --no-strict is passed via cli and no files are found',
    { todo: expectedStackTraceBug ? 'Fails on these node versions' : false },
    function (tt) {
        tt.plan(3);

        execFile(process.execPath, [tapeBin, '--no-strict', 'no*files*found'], { cwd: path.join(__dirname) }, function (err, stdout, stderr) {
            tt.equal(stripDeprecations(stderr.toString('utf8')), '');
            tt.same(stripFullStack(stdout.toString('utf8')), [
                'TAP version 13',
                '',
                '1..0',
                '# tests 0',
                '# pass  0',
                '',
                '# ok',
                '',
                ''
            ]);
            tt.equal(err, null); // code 0
        });
    }
);

tap.test(
    'should not throw error when no files are found',
    { todo: expectedStackTraceBug ? 'Fails on these node versions' : false },
    function (tt) {
        tt.plan(3);

        execFile(process.execPath, [tapeBin, 'no*files*found'], { cwd: path.join(__dirname) }, function (err, stdout, stderr) {
            tt.equal(stripDeprecations(stderr.toString('utf8')), '');
            tt.same(stripFullStack(stdout.toString('utf8')), [
                'TAP version 13',
                '',
                '1..0',
                '# tests 0',
                '# pass  0',
                '',
                '# ok',
                '',
                ''
            ]);
            tt.equal(err, null); // code 0
        });
    }
);
