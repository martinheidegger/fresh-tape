'use strict';

var deepEqual = require('deep-equal');
var defined = require('defined');
var path = require('path-pony');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var callBind = require('call-bind');
var isRegExp = require('is-regex');
var callBound = require('call-bind/callBound');
var inspect = require('object-inspect');
var mockProperty = require('mock-property');

var isEnumerable = callBound('Object.prototype.propertyIsEnumerable');
var toLowerCase = callBound('String.prototype.toLowerCase');
var isProto = callBound('Object.prototype.isPrototypeOf');
var $exec = callBound('RegExp.prototype.exec');
var objectToString = callBound('Object.prototype.toString');
var $split = callBound('String.prototype.split');
var $replace = callBound('String.prototype.replace');
var $trim = callBound('String.prototype.trim');
var $strSlice = callBound('String.prototype.slice');
var $push = callBound('Array.prototype.push');
var $shift = callBound('Array.prototype.shift');
var $slice = callBound('Array.prototype.slice');

function getDirname() {
    // __dirname is not a global in node, (global.__dirname does not exist)
    // This way works both in node and without it.
    return __dirname;
}

var dirname;
try {
    dirname = getDirname();
} catch (_) {}

module.exports = Test;

var nextTick = typeof setImmediate !== 'undefined'
    ? setImmediate
    : process.nextTick;
var safeSetTimeout = setTimeout;
var safeClearTimeout = clearTimeout;

inherits(Test, EventEmitter);

// eslint-disable-next-line no-unused-vars
var getTestArgs = function (name_, opts_, cb_) {
    var name = '(anonymous)';
    var opts = {};
    var cb;

    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (typeof arg === 'string') {
            name = arg;
        } else if (typeof arg === 'object') {
            opts = arg || opts;
        } else if (typeof arg === 'function') {
            cb = arg;
        }
    }
    return {
        name: name,
        opts: opts,
        cb: cb
    };
};

function Test(name_, opts_, cb_) {
    if (!(this instanceof Test)) {
        return new Test(name_, opts_, cb_);
    }

    var args = getTestArgs(name_, opts_, cb_);

    this.readable = true;
    this.name = args.name || '(anonymous)';
    this.assertCount = 0;
    this.pendingCount = 0;
    this._skip = args.opts.skip || false;
    this._todo = args.opts.todo || false;
    this._timeout = args.opts.timeout;
    this._plan = undefined;
    this._cb = args.cb;
    this.ended = false;
    this._progeny = [];
    this._teardown = [];
    this._ok = true;
    this._objectPrintDepth = 5;
    var depthEnvVar = process.env.NODE_TAPE_OBJECT_PRINT_DEPTH;
    if (args.opts.objectPrintDepth) {
        this._objectPrintDepth = args.opts.objectPrintDepth;
    } else if (depthEnvVar) {
        if (toLowerCase(depthEnvVar) === 'infinity') {
            this._objectPrintDepth = Infinity;
        } else {
            this._objectPrintDepth = depthEnvVar;
        }
    }

    for (var prop in this) {
        if (typeof this[prop] === 'function') {
            this[prop] = callBind(this[prop], this);
        }
    }
}

Test.prototype.run = function run() {
    this.emit('prerun');
    if (!this._cb || this._skip) {
        this._end();
        return;
    }
    if (this._timeout !== null && this._timeout !== undefined) {
        this.timeoutAfter(this._timeout);
    }

    var callbackReturn = this._cb(this);

    if (
        typeof Promise === 'function'
        && callbackReturn
        && typeof callbackReturn.then === 'function'
    ) {
        var self = this;
        Promise.resolve(callbackReturn).then(
            function onResolve() {
                if (!self.calledEnd) {
                    self.end();
                }
            },
            function onError(err) {
                if (self.calledEnd) {
                    return;
                }
                if (err instanceof Error || objectToString(err) === '[object Error]') {
                    self.ifError(err);
                } else {
                    self.fail(err);
                }
                self.end();
            }
        );
        return;
    }

    this.emit('run');
};

Test.prototype.test = function test(name, opts, cb) {
    var self = this;
    var t = new Test(name, opts, cb);
    $push(this._progeny, t);
    this.pendingCount += 1;
    this.emit('test', t);
    t.on('prerun', function () {
        self.assertCount += 1;
    });

    if (!self._pendingAsserts()) {
        nextTick(function () {
            self._end();
        });
    }

    nextTick(function () {
        if (!self._plan && self.pendingCount === self._progeny.length) {
            self._end();
        }
    });
};

Test.prototype.comment = function comment(msg) {
    var that = this;
    $split($trim(msg), '\n').forEach(function (aMsg) {
        that.emit('result', $replace($trim(aMsg), /^#\s*/, ''));
    });
};

Test.prototype.plan = function plan(n) {
    this._plan = n;
    this.emit('plan', n);
};

Test.prototype.timeoutAfter = function timeoutAfter(ms) {
    if (!ms) { throw new Error('timeoutAfter requires a timespan'); }
    var self = this;
    var timeout = safeSetTimeout(function () {
        self.fail(self.name + ' timed out after ' + ms + 'ms');
        self.end();
    }, ms);
    this.once('end', function () {
        safeClearTimeout(timeout);
    });
};

Test.prototype.end = function end(err) {
    if (arguments.length >= 1 && !!err) {
        this.ifError(err);
    }

    if (this.calledEnd) {
        this.fail('.end() already called');
    }
    this.calledEnd = true;
    this._end();
};

Test.prototype.teardown = function teardown(fn) {
    if (typeof fn !== 'function') {
        this.fail('teardown: ' + inspect(fn) + ' is not a function');
    } else {
        this._teardown.push(fn);
    }
};

function wrapFunction(original) {
    if (typeof original !== 'undefined' && typeof original !== 'function') {
        throw new TypeError('`original` must be a function or `undefined`');
    }

    var bound = original && callBind.apply(original);

    var calls = [];

    var wrapObject = {
        __proto__: null,
        wrapped: function wrapped() {
            var args = $slice(arguments);
            var completed = false;
            try {
                var returned = bound ? bound(this, arguments) : void undefined;
                calls[calls.length] = { args: args, receiver: this, returned: returned };
                completed = true;
                return returned;
            } finally {
                if (!completed) {
                    calls[calls.length] = { args: args, receiver: this, threw: true };
                }
            }
        },
        calls: calls,
        results: function results() {
            try {
                return calls;
            } finally {
                calls = [];
                wrapObject.calls = calls;
            }
        }
    };
    return wrapObject;
}

Test.prototype.capture = function capture(obj, method) {
    if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
        throw new TypeError('`obj` must be an object');
    }
    if (typeof method !== 'string' && typeof method !== 'symbol') {
        throw new TypeError('`method` must be a string or a symbol');
    }
    var implementation = arguments.length > 2 ? arguments[2] : void undefined;
    if (typeof implementation !== 'undefined' && typeof implementation !== 'function') {
        throw new TypeError('`implementation`, if provided, must be a function');
    }

    var wrapper = wrapFunction(implementation);
    var restore = mockProperty(obj, method, { value: wrapper.wrapped });
    this.teardown(restore);

    wrapper.results.restore = restore;

    return wrapper.results;
};

Test.prototype.captureFn = function captureFn(original) {
    if (typeof original !== 'function') {
        throw new TypeError('`original` must be a function');
    }

    var wrapObject = wrapFunction(original);
    wrapObject.wrapped.calls = wrapObject.calls;
    return wrapObject.wrapped;
};

Test.prototype.intercept = function intercept(obj, property) {
    if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
        throw new TypeError('`obj` must be an object');
    }
    if (typeof property !== 'string' && typeof property !== 'symbol') {
        throw new TypeError('`property` must be a string or a symbol');
    }
    var desc = arguments.length > 2 ? arguments[2] : { __proto__: null };
    if (typeof desc !== 'undefined' && (!desc || typeof desc !== 'object')) {
        throw new TypeError('`desc`, if provided, must be an object');
    }
    if ('configurable' in desc && !desc.configurable) {
        throw new TypeError('`desc.configurable`, if provided, must be `true`, so that the interception can be restored later');
    }
    var isData = 'writable' in desc || 'value' in desc;
    var isAccessor = 'get' in desc || 'set' in desc;
    if (isData && isAccessor) {
        throw new TypeError('`value` and `writable` can not be mixed with `get` and `set`');
    }
    var strictMode = arguments.length > 3 ? arguments[3] : true;
    if (typeof strictMode !== 'boolean') {
        throw new TypeError('`strictMode`, if provided, must be a boolean');
    }

    var calls = [];
    var getter = desc.get && callBind.apply(desc.get);
    var setter = desc.set && callBind.apply(desc.set);
    var value = !isAccessor ? desc.value : void undefined;
    var writable = !!desc.writable;

    function getInterceptor() {
        var args = $slice(arguments);
        if (isAccessor) {
            if (getter) {
                var completed = false;
                try {
                    var returned = getter(this, arguments);
                    completed = true;
                    calls[calls.length] = { type: 'get', success: true, value: returned, args: args, receiver: this };
                    return returned;
                } finally {
                    if (!completed) {
                        calls[calls.length] = { type: 'get', success: false, threw: true, args: args, receiver: this };
                    }
                }
            }
        }
        calls[calls.length] = { type: 'get', success: true, value: value, args: args, receiver: this };
        return value;
    }

    function setInterceptor(v) {
        var args = $slice(arguments);
        if (isAccessor && setter) {
            var completed = false;
            try {
                var returned = setter(this, arguments);
                completed = true;
                calls[calls.length] = { type: 'set', success: true, value: v, args: args, receiver: this };
                return returned;
            } finally {
                if (!completed) {
                    calls[calls.length] = { type: 'set', success: false, threw: true, args: args, receiver: this };
                }
            }
        }
        var canSet = isAccessor || writable;
        if (canSet) {
            value = v;
        }
        calls[calls.length] = { type: 'set', success: !!canSet, value: value, args: args, receiver: this };

        if (!canSet && strictMode) {
            throw new TypeError('Cannot assign to read only property `' + inspect(property) + '` of object `' + inspect(obj) + '`');
        }
        return value;
    }

    var restore = mockProperty(obj, property, {
        nonEnumerable: !!desc.enumerable,
        get: getInterceptor,
        set: setInterceptor
    });
    this.teardown(restore);

    function results() {
        try {
            return calls;
        } finally {
            calls = [];
        }
    }
    results.restore = restore;

    return results;
};

Test.prototype._end = function _end(err) {
    var self = this;
    var asyncErr = err;

    if (!this._cb && !this._todo && !this._skip) {
        this.fail('# TODO ' + this.name);
    }

    if (this._progeny.length) {
        var t = $shift(this._progeny);
        t.on('end', function () { self._end(); });
        t.run();
        return;
    }

    function next() {
        if (self._teardown.length === 0) {
            completeEnd();
            return;
        }
        var fn = self._teardown.shift();
        var res;
        try {
            res = fn();
        } catch (e) {
            self.fail(e);
        }
        if (res && typeof res.then === 'function') {
            res.then(next, function (_err) {
                // TODO: wth?
                asyncErr = asyncErr || _err;
            });
        } else {
            next();
        }
    }

    next();

    function completeEnd() {
        if (!self.ended) { self.emit('end'); }
        var pendingAsserts = self._pendingAsserts();
        if (!self._planError && self._plan !== undefined && pendingAsserts) {
            self._planError = true;
            self.fail('plan != count', {
                expected: self._plan,
                actual: self.assertCount
            });
        }
        self.ended = true;
    }
};

Test.prototype._exit = function _exit() {
    if (this._plan !== undefined && !this._planError && this.assertCount !== this._plan) {
        this._planError = true;
        this.fail('plan != count', {
            expected: this._plan,
            actual: this.assertCount,
            exiting: true
        });
    } else if (!this.ended) {
        this.fail('test exited without ending: ' + this.name, {
            exiting: true
        });
    }
};

Test.prototype._pendingAsserts = function _pendingAsserts() {
    if (this._plan === undefined) {
        return 1;
    }
    return this._plan - (this._progeny.length + this.assertCount);
};

function trySetAtFromStackString(stackStr, acc) {
    if (!stackStr) {
        return;
    }
    var err = $split(stackStr, '\n');
    var tapeDir = dirname + path.sep;

    for (var i = 0; i < err.length; i++) {
        // Windows stacks use CRLF; split('\n') leaves a trailing \r on each line, which breaks
        // regexes that use $ after the closing `)` of the path.
        var rawLine = $replace(err[i], /\r/g, '');
        /*
            Stack trace lines may resemble one of the following.
            We need to correctly extract a function name (if any) and path / line number for each line.

                at myFunction (/path/to/file.js:123:45)
                at myFunction (/path/to/file.other-ext:123:45)
                at myFunction (/path to/file.js:123:45)
                at myFunction (C:\path\to\file.js:123:45)
                at myFunction (/path/to/file.js:123)
                at Test.<anonymous> (/path/to/file.js:123:45)
                at Test.bound [as run] (/path/to/file.js:123:45)
                at /path/to/file.js:123:45

            Regex has three parts. First is non-capturing group for 'at ' (plus anything preceding it).

                /^(?:[^\s]*\s*\bat\s+)/

            Second captures function call description (optional).
            This is not necessarily a valid JS function name, but just what the stack trace is using to represent a function call.
            It may look like `<anonymous>` or 'Test.bound [as run]'.

            For our purposes, we assume that, if there is a function name, it's everything leading up to the first open parentheses (trimmed) before our pathname.

                /(?:(.*)\s+\()?/

            Last part captures file path plus line no (and optional column no).

                /((?:[/\\]|[a-zA-Z]:\\)[^:\)]+:(\d+)(?::(\d+))?)\)?/

            `file:` URLs on Windows look like `file:///D:/path/...`; `:` is not valid in `[^:]`, so
            we fall back when `re` misses (see below) by parsing the last `path:line:col` inside `(...)`.
        */
        var re = /^(?:[^\s]*\s*\bat\s+)(?:(.*)\s+\()?((?:[/\\]|[a-zA-Z]:\\|file:\/\/)[^:)]+:(\d+)(?::(\d+))?)\)?$/;
        var lineWithTokens = $replace(
            $replace(
                rawLine,
                process.cwd(),
                path.sep + '$CWD'
            ),
            tapeDir,
            path.sep + '$TEST' + path.sep
        );
        var m = re.exec(lineWithTokens);

        if (!m) {
            // Fallback: paths like `file:///D:/...` (Windows) contain `:` in the drive segment
            // (`D:`), so `[^:)]+` in `re` above cannot match. Parse the path inside the last
            // `(...)` and take the last `:line:col` triple.
            var paren = /^(?:[^\s]*\s*\bat\s+)(?:(.*)\s+\()?\((.+)\)\s*$/;
            var pm = paren.exec(lineWithTokens);
            if (pm) {
                var locTail = /^(.+):(\d+):(\d+)$/.exec(pm[2]);
                if (locTail) {
                    m = [null, pm[1], locTail[1], locTail[2], locTail[3]];
                }
            }
        }

        if (!m) {
            continue;
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

        if ($strSlice(filePath, 0, tapeDir.length) === tapeDir) {
            continue;
        }

        // Function call description may not (just) be a function name.
        // Try to extract function name by looking at first "word" only.
        acc.functionName = $split(callDescription, /\s+/)[0];
        acc.file = filePath;
        acc.line = Number(m[3]);
        if (m[4]) { acc.column = Number(m[4]); }

        acc.at = callDescription + ' (' + filePath + ':' + acc.line + (acc.column ? ':' + acc.column : '') + ')';
        return;
    }
}

function assertStackLocation(actualOK, res) {
    if (actualOK || dirname === undefined) {
        return;
    }
    var acc = res;
    trySetAtFromStackString(new Error('exception').stack, acc);
    // On some Windows/Node builds the synthetic stack omits the test file; the assertion error
    // stack still includes the user frame. Skip for `operator: error` (promise rejections): those
    // tests expect TAP without a YAML `at` line when only the synthetic stack was used before.
    if (!acc.at && res.error && res.error.stack && res.operator !== 'error') {
        trySetAtFromStackString(res.error.stack, acc);
    }
}

Test.prototype._assert = function assert(ok, opts) {
    var self = this;
    var extra = opts.extra || {};

    var actualOK = !!ok || !!extra.skip;

    var name = defined(extra.message, opts.message, '(unnamed assert)');
    if (this.calledEnd && opts.operator !== 'fail') {
        this.fail('.end() already called: ' + name);
        return;
    }

    var assertId = self.assertCount;
    self.assertCount += 1;
    var res = {
        id: assertId,
        ok: actualOK,
        skip: defined(extra.skip, opts.skip),
        todo: defined(extra.todo, opts.todo, self._todo),
        name: name,
        operator: defined(extra.operator, opts.operator),
        objectPrintDepth: self._objectPrintDepth
    };
    if (Object.prototype.hasOwnProperty.call(opts, 'actual')
        || Object.prototype.hasOwnProperty.call(extra, 'actual')) {
        res.actual = defined(extra.actual, opts.actual);
    }
    if (Object.prototype.hasOwnProperty.call(opts, 'expected')
        || Object.prototype.hasOwnProperty.call(extra, 'expected')) {
        res.expected = defined(extra.expected, opts.expected);
    }
    this._ok = !!(this._ok && actualOK);

    if (!actualOK && !res.todo) {
        res.error = defined(extra.error, opts.error, new Error(res.name));
    }

    assertStackLocation(actualOK, res);

    self.emit('result', res);

    var pendingAsserts = self._pendingAsserts();
    if (!pendingAsserts) {
        if (extra.exiting) {
            self._end();
        } else {
            nextTick(function () {
                self._end();
            });
        }
    }

    if (!self._planError && pendingAsserts < 0) {
        self._planError = true;
        self.fail('plan != count', {
            expected: self._plan,
            actual: self._plan - pendingAsserts
        });
    }
};

Test.prototype.fail = function fail(msg, extra) {
    this._assert(false, {
        message: msg,
        operator: 'fail',
        extra: extra
    });
};

Test.prototype.pass = function pass(msg, extra) {
    this._assert(true, {
        message: msg,
        operator: 'pass',
        extra: extra
    });
};

Test.prototype.skip = function skip(msg, extra) {
    this._assert(true, {
        message: msg,
        operator: 'skip',
        skip: true,
        extra: extra
    });
};

var testAssert = function assert(value, msg, extra) {
    this._assert(value, {
        message: defined(msg, 'should be truthy'),
        operator: 'ok',
        expected: true,
        actual: value,
        extra: extra
    });
};
Test.prototype.ok
= Test.prototype['true']
= Test.prototype.assert
= testAssert;

function notOK(value, msg, extra) {
    this._assert(!value, {
        message: defined(msg, 'should be falsy'),
        operator: 'notOk',
        expected: false,
        actual: value,
        extra: extra
    });
}
Test.prototype.notOk
= Test.prototype['false']
= Test.prototype.notok
= notOK;

function error(err, msg, extra) {
    this._assert(!err, {
        message: defined(msg, String(err)),
        operator: 'error',
        error: err,
        extra: extra
    });
}
Test.prototype.error
= Test.prototype.ifError
= Test.prototype.ifErr
= Test.prototype.iferror
= error;

function strictEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(Object.is(a, b), {
        message: defined(msg, 'should be strictly equal'),
        operator: 'equal',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.equal
= Test.prototype.equals
= Test.prototype.isEqual
= Test.prototype.strictEqual
= Test.prototype.strictEquals
= Test.prototype.is
= strictEqual;

function notStrictEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(!Object.is(a, b), {
        message: defined(msg, 'should not be strictly equal'),
        operator: 'notEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}

Test.prototype.notEqual
= Test.prototype.notEquals
= Test.prototype.isNotEqual
= Test.prototype.doesNotEqual
= Test.prototype.isInequal
= Test.prototype.notStrictEqual
= Test.prototype.notStrictEquals
= Test.prototype.isNot
= Test.prototype.not
= notStrictEqual;

function looseEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(a == b, {
        message: defined(msg, 'should be loosely equal'),
        operator: 'looseEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}

Test.prototype.looseEqual
= Test.prototype.looseEquals
= looseEqual;

function notLooseEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(a != b, {
        message: defined(msg, 'should not be loosely equal'),
        operator: 'notLooseEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.notLooseEqual
= Test.prototype.notLooseEquals
= notLooseEqual;

function tapeDeepEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(deepEqual(a, b, { strict: true }), {
        message: defined(msg, 'should be deeply equivalent'),
        operator: 'deepEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.deepEqual
= Test.prototype.deepEquals
= Test.prototype.isEquivalent
= Test.prototype.same
= tapeDeepEqual;

function notDeepEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(!deepEqual(a, b, { strict: true }), {
        message: defined(msg, 'should not be deeply equivalent'),
        operator: 'notDeepEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.notDeepEqual
= Test.prototype.notDeepEquals
= Test.prototype.notEquivalent
= Test.prototype.notDeeply
= Test.prototype.notSame
= Test.prototype.isNotDeepEqual
= Test.prototype.isNotDeeply
= Test.prototype.isNotEquivalent
= Test.prototype.isInequivalent
= notDeepEqual;

function deepLooseEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(deepEqual(a, b), {
        message: defined(msg, 'should be loosely deeply equivalent'),
        operator: 'deepLooseEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}

Test.prototype.deepLooseEqual
= deepLooseEqual;

function notDeepLooseEqual(a, b, msg, extra) {
    if (arguments.length < 2) {
        throw new TypeError('two arguments must be provided to compare');
    }
    this._assert(!deepEqual(a, b), {
        message: defined(msg, 'should not be loosely deeply equivalent'),
        operator: 'notDeepLooseEqual',
        actual: a,
        expected: b,
        extra: extra
    });
}
Test.prototype.notDeepLooseEqual
= notDeepLooseEqual;

function throwsExpectation(caught, exp) {
    var passed = caught;
    var out = exp;
    if (!caught) {
        return { passed: false, e: out };
    }
    if (typeof out === 'string' && caught.error && caught.error.message === out) {
        throw new TypeError('The "error/message" argument is ambiguous. The error message ' + inspect(out) + ' is identical to the message.');
    }
    if (typeof out === 'function') {
        if (typeof out.prototype !== 'undefined' && caught.error instanceof out) {
            passed = true;
        } else if (isProto(Error, out)) {
            passed = false;
        } else {
            passed = out.call({}, caught.error) === true;
        }
    } else if (isRegExp(out)) {
        passed = $exec(out, caught.error) !== null;
        out = inspect(out);
    } else if (out && typeof out === 'object') {
        if (caught.error && typeof caught.error === 'object') {
            var keys = Object.keys(out);
            if (out instanceof Error) {
                $push(keys, 'name', 'message');
            } else if (keys.length === 0) {
                throw new TypeError('`throws` validation object must not be empty');
            }
            passed = keys.every(function (key) {
                if (typeof caught.error[key] === 'string' && isRegExp(out[key]) && $exec(out[key], caught.error[key]) !== null) {
                    return true;
                }
                if (key in caught.error && deepEqual(caught.error[key], out[key], { strict: true })) {
                    return true;
                }
                return false;
            });
        } else {
            passed = false;
        }
    }
    return { passed: !!passed, e: out };
}

Test.prototype['throws'] = function (fn, expected, msg, extra) {
    var e = expected;
    var m = msg;
    if (typeof expected === 'string') {
        m = expected;
        e = undefined;
    }

    var caught;

    try {
        fn();
    } catch (err) {
        caught = { error: err };
        if (Object(err) === err && 'message' in err && (!isEnumerable(err, 'message') || !Object.prototype.hasOwnProperty.call(err, 'message'))) {
            try {
                var message = err.message;
                delete err.message;
                err.message = message;
            } catch (noopErr) { /**/ }
        }
    }

    var outcome = throwsExpectation(caught, e);
    var passed = outcome.passed;
    e = outcome.e;

    this._assert(!!passed, {
        message: defined(m, 'should throw'),
        operator: 'throws',
        actual: caught && caught.error,
        expected: e,
        error: !passed && caught && caught.error,
        extra: extra
    });
};

Test.prototype.doesNotThrow = function doesNotThrow(fn, expected, msg, extra) {
    var e = expected;
    var m = msg;
    if (typeof expected === 'string') {
        m = expected;
        e = undefined;
    }
    var caught;
    try {
        fn();
    } catch (err) {
        caught = { error: err };
    }
    this._assert(!caught, {
        message: defined(m, 'should not throw'),
        operator: 'throws',
        actual: caught && caught.error,
        expected: e,
        error: caught && caught.error,
        extra: extra
    });
};

Test.prototype.match = function match(string, regexp, msg, extra) {
    if (!isRegExp(regexp)) {
        this._assert(false, {
            message: defined(msg, 'The "regexp" argument must be an instance of RegExp. Received type ' + typeof regexp + ' (' + inspect(regexp) + ')'),
            operator: 'match',
            actual: objectToString(regexp),
            expected: '[object RegExp]',
            extra: extra
        });
    } else if (typeof string !== 'string') {
        this._assert(false, {
            message: defined(msg, 'The "string" argument must be of type string. Received type ' + typeof string + ' (' + inspect(string) + ')'),
            operator: 'match',
            actual: string === null ? null : typeof string,
            expected: 'string',
            extra: extra
        });
    } else {
        var matches = $exec(regexp, string) !== null;
        var message = defined(
            msg,
            'The input ' + (matches ? 'matched' : 'did not match') + ' the regular expression ' + inspect(regexp) + '. Input: ' + inspect(string)
        );
        this._assert(matches, {
            message: message,
            operator: 'match',
            actual: string,
            expected: regexp,
            extra: extra
        });
    }
};

Test.prototype.doesNotMatch = function doesNotMatch(string, regexp, msg, extra) {
    if (!isRegExp(regexp)) {
        this._assert(false, {
            message: defined(msg, 'The "regexp" argument must be an instance of RegExp. Received type ' + typeof regexp + ' (' + inspect(regexp) + ')'),
            operator: 'doesNotMatch',
            actual: objectToString(regexp),
            expected: '[object RegExp]',
            extra: extra
        });
    } else if (typeof string !== 'string') {
        this._assert(false, {
            message: defined(msg, 'The "string" argument must be of type string. Received type ' + typeof string + ' (' + inspect(string) + ')'),
            operator: 'doesNotMatch',
            actual: string === null ? null : typeof string,
            expected: 'string',
            extra: extra
        });
    } else {
        var matches = $exec(regexp, string) !== null;
        var message = defined(
            msg,
            'The input ' + (matches ? 'was expected to not match' : 'did not match') + ' the regular expression ' + inspect(regexp) + '. Input: ' + inspect(string)
        );
        this._assert(!matches, {
            message: message,
            operator: 'doesNotMatch',
            actual: string,
            expected: regexp,
            extra: extra
        });
    }
};

Test.prototype.assertion = function assertion(fn) {
    return callBind.apply(fn)(this, $slice(arguments, 1));
};

// eslint-disable-next-line no-unused-vars
Test.skip = function skip(name_, _opts, _cb) {
    var args = getTestArgs.apply(null, arguments);
    args.opts.skip = true;
    return new Test(args.name, args.opts, args.cb);
};

// vim: set softtabstop=4 shiftwidth=4:
