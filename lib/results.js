'use strict';

var path = require('path-pony');
var defined = require('defined');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var Transform = require('@leichtgewicht/readable-stream').Transform;
var inspect = require('object-inspect');
var callBound = require('call-bind/callBound');
var $exec = callBound('RegExp.prototype.exec');
var $split = callBound('String.prototype.split');
var $replace = callBound('String.prototype.replace');
var $shift = callBound('Array.prototype.shift');
var $push = callBound('Array.prototype.push');
var yamlIndicators = /:|-|\?/;
var nextTick = typeof setImmediate !== 'undefined'
    ? setImmediate
    : process.nextTick;

function coalesceWhiteSpaces(str) {
    return $replace(String(str), /\s+/g, ' ');
}

function invalidYaml(str) {
    return $exec(yamlIndicators, str) !== null;
}

function passthrough(input, _encoding, cb) {
    cb(null, input);
}

function getNextTest(results) {
    if (!results._only) {
        return $shift(results.tests);
    }

    do {
        var t = $shift(results.tests);
        if (t && results._only === t) {
            return t;
        }
    } while (results.tests.length !== 0);

    return void undefined;
}

function appendStackYaml(output, inner, stack) {
    var acc = output;
    var lines = $split(String(stack), '\n');
    acc += inner + 'stack: |-\n';
    for (var i = 0; i < lines.length; i++) {
        acc += inner + '  ' + lines[i] + '\n';
    }
    return acc;
}

function tapeLibDir() {
    return __dirname + path.sep;
}

/**
 * Same stack-line parsing as lib/test.js trySetAtFromStackString; returns YAML `at` string or null.
 */
function atFromTokensLine(lineWithTokens, tapeDir) {
    var re = /^(?:[^\s]*\s*\bat\s+)(?:(.*)\s+\()?((?:[/\\]|[a-zA-Z]:\\|file:\/\/)[^:)]+:(\d+)(?::(\d+))?)\)?$/;
    var m = re.exec(lineWithTokens);
    if (!m) {
        var paren = /^(?:[^\s]*\s*\bat\s+)(?:(.*)\s+\()?\((.+)\)\s*$/;
        var pm = paren.exec(lineWithTokens);
        if (pm) {
            var locTail = /^(.+):(\d+):(\d+)$/.exec(pm[2]);
            if (locTail) {
                m = [
                    null,
                    pm[1],
                    locTail[1],
                    locTail[2],
                    locTail[3]
                ];
            }
        }
    }
    if (!m) {
        return null;
    }
    var callDescription = m[1] || '<anonymous>';
    var filePath = $replace(
        $replace(
            $replace(m[2], path.sep + '$TEST' + path.sep, tapeDir),
            path.sep + '$CWD',
            process.cwd()
        ),
        /:\d+:\d+$/,
        ''
    );
    if (filePath.slice(0, tapeDir.length) === tapeDir) {
        return null;
    }
    var lineNum = Number(m[3]);
    var colNum = m[4] ? Number(m[4]) : undefined;
    return callDescription + ' (' + filePath + ':' + lineNum + (colNum ? ':' + colNum : '') + ')';
}

/**
 * When lib/test.js assertStackLocation cannot derive `at` (e.g. Windows + ESM + odd V8 stacks),
 * still emit YAML `at` for TAP by parsing res.error.stack here. Skip for `operator: error`
 * (promise / t.error) to match existing TAP expectations.
 */
function tapAtFromStack(res) {
    if (res.at || !res.error || !res.error.stack || res.operator === 'error') {
        return;
    }
    var tapeDir = tapeLibDir();
    var err = $split(String(res.error.stack), '\n');
    var i;
    for (i = 0; i < err.length; i++) {
        var rawLine = $replace(err[i], /\r/g, '');
        var lineWithTokens = $replace(
            $replace(
                rawLine,
                process.cwd(),
                path.sep + '$CWD'
            ),
            tapeDir,
            path.sep + '$TEST' + path.sep
        );
        var atStr = atFromTokensLine(lineWithTokens, tapeDir);
        if (atStr) {
            res.at = atStr;
            return;
        }
    }
    // If cwd/tape token replacement interfered, scan raw `file:///...` frames (greedy path + :line:col).
    var looseRe = /\bat\s+(.+?)\s+\((file:\/\/\/.+):(\d+):(\d+)\)/g;
    var lm;
    while ((lm = looseRe.exec(String(res.error.stack))) !== null) {
        var pNorm = $replace(lm[2], /\\/g, '/');
        if (!/\/lib\/(test|results)\.js($|:)/i.test(pNorm)) {
            res.at = lm[1] + ' (' + lm[2] + ':' + lm[3] + ':' + lm[4] + ')';
            return;
        }
    }
}

function encodeResult(res, count, todoIsOK) {
    var output = '';
    output += (res.ok || (todoIsOK && res.todo) ? 'ok ' : 'not ok ') + count;
    output += res.name ? ' ' + coalesceWhiteSpaces(res.name) : '';

    if (res.skip) {
        output += ' # SKIP' + (typeof res.skip === 'string' ? ' ' + coalesceWhiteSpaces(res.skip) : '');
    } else if (res.todo) {
        output += ' # TODO' + (typeof res.todo === 'string' ? ' ' + coalesceWhiteSpaces(res.todo) : '');
    }

    output += '\n';
    if (res.ok) { return output; }

    tapAtFromStack(res);

    var outer = '  ';
    var inner = outer + '  ';
    output += outer + '---\n';
    output += inner + 'operator: ' + res.operator + '\n';

    if (Object.prototype.hasOwnProperty.call(res, 'expected')
        || Object.prototype.hasOwnProperty.call(res, 'actual')) {
        var ex = inspect(res.expected, { depth: res.objectPrintDepth });
        var ac = inspect(res.actual, { depth: res.objectPrintDepth });

        if (Math.max(ex.length, ac.length) > 65 || invalidYaml(ex) || invalidYaml(ac)) {
            output += inner + 'expected: |-\n' + inner + '  ' + ex + '\n';
            output += inner + 'actual: |-\n' + inner + '  ' + ac + '\n';
        } else {
            output += inner + 'expected: ' + ex + '\n';
            output += inner + 'actual:   ' + ac + '\n';
        }
    }
    if (res.at) {
        output += inner + 'at: ' + res.at + '\n';
    }

    var actualStack = res.actual && (typeof res.actual === 'object' || typeof res.actual === 'function') ? res.actual.stack : undefined;
    var errorStack = res.error && res.error.stack;
    var stack = defined(actualStack, errorStack);
    if (stack) {
        output = appendStackYaml(output, inner, stack);
    }

    output += outer + '...\n';
    return output;
}

function Results(options) {
    if (!(this instanceof Results)) { return new Results(options); }
    var opts = (arguments.length > 0 ? arguments[0] : options) || {};
    this.count = 0;
    this.fail = 0;
    this.pass = 0;
    this.todo = 0;
    this._stream = new Transform();
    this.tests = [];
    this._only = null;
    this._isRunning = false;
    this.todoIsOK = !!opts.todoIsOK;
}

module.exports = Results;
inherits(Results, EventEmitter);

Results.prototype.createStream = function (opts) {
    var streamOpts = opts || {};
    var self = this;
    var output;
    var testId = 0;
    if (streamOpts.objectMode) {
        output = new Transform({ objectMode: true, transform: passthrough });
        self.on('_push', function ontest(t, extra) {
            var id = testId;
            testId += 1;
            t.once('prerun', function () {
                var row = {
                    type: 'test',
                    name: t.name,
                    id: id,
                    skip: t._skip,
                    todo: t._todo
                };
                if (extra && Object.prototype.hasOwnProperty.call(extra, 'parent')) {
                    row.parent = extra.parent;
                }
                output.push(row);
            });
            t.on('test', function (st) {
                ontest(st, { parent: id });
            });
            t.on('result', function (res) {
                if (res && typeof res === 'object') {
                    output.push(Object.assign({}, res, {
                        test: id,
                        type: 'assert'
                    }));
                } else {
                    output.push(res);
                }
            });
            t.on('end', function () {
                output.push({ type: 'end', test: id });
            });
        });
        self.on('done', function () {
            output.push(null);
        });
    } else {
        output = new Transform({ transform: passthrough });
        output.push('TAP version 13\n');
        self._stream.pipe(output);
    }

    if (!this._isRunning) {
        this._isRunning = true;
        nextTick(function next() {
            var t = getNextTest(self);
            while (t) {
                t.run();
                if (!t.ended) {
                    t.once('end', function () { nextTick(next); });
                    return;
                }
                t = getNextTest(self);
            }
            self.emit('done');
        });
    }

    return output;
};

Results.prototype.push = function (t) {
    $push(this.tests, t);
    this._watch(t);
    this.emit('_push', t);
};

Results.prototype.only = function (t) {
    this._only = t;
};

Results.prototype._watch = function (t) {
    var self = this;
    var write = function (s) { self._stream.push(s); };
    t.once('prerun', function () {
        var premsg = '';
        var postmsg = '';
        if (t._skip) {
            premsg = 'SKIP ';
            postmsg = typeof t._skip === 'string' ? ' ' + coalesceWhiteSpaces(t._skip) : '';
        } else if (t._todo) {
            premsg = 'TODO ';
        }
        write('# ' + premsg + coalesceWhiteSpaces(t.name) + postmsg + '\n');
    });

    t.on('result', function (res) {
        if (typeof res === 'string') {
            write('# ' + res + '\n');
            return;
        }
        write(encodeResult(res, self.count + 1, self.todoIsOK));
        self.count += 1;

        if (res.ok || res.todo) {
            self.pass += 1;
        } else {
            self.fail += 1;
            self.emit('fail');
        }
    });

    t.on('test', function (st) { self._watch(st); });
};

Results.prototype.close = function () {
    var self = this;
    if (self.closed) { self._stream.emit('error', new Error('ALREADY CLOSED')); }
    self.closed = true;
    var write = function (s) { self._stream.push(s); };

    write('\n1..' + self.count + '\n');
    write('# tests ' + self.count + '\n');
    write('# pass  ' + (self.pass + self.todo) + '\n');
    if (self.todo) { write('# todo  ' + self.todo + '\n'); }
    if (self.fail) {
        write('# fail  ' + self.fail + '\n');
    } else {
        write('\n# ok\n');
    }

    self._stream.push(null);
    self._stream.end();
};
