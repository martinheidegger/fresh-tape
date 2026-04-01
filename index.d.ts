// Type definitions for fresh-tape (aligned with tape 5.9.x API surface)
// Project: https://github.com/martinheidegger/fresh-tape
// Based on definitions for tape by Bart van der Schoor, Haoqun Jiang, Dennis Schwartz,
// Michael Henretty, Rafał Ostrowski, Jordan Harband

/// <reference types="node" />

export = tape;

/**
 * Create a new test with an optional name string and optional opts object.
 * cb(t) fires with the new test object t once all preceeding tests have finished.
 * Tests execute serially.
 */
declare function tape(name: string, cb: tape.TestCase): void;
declare function tape(name: string, opts: tape.TestOptions, cb: tape.TestCase): void;
declare function tape(cb: tape.TestCase): void;
declare function tape(opts: tape.TestOptions, cb: tape.TestCase): void;

declare namespace tape {
    /** Defer wiring the default stream until `tape.run()` is called. */
    export function wait(): void;
    /** Start the default TAP stream when `wait()` was used. */
    export function run(): void;
    /** Return the process-level harness (creates it on first use). */
    export function getHarness(opts?: GetHarnessOptions): Harness;
    /** Tap compat: alias for the default export (`tape` callable). */
    export const test: typeof tape;
    interface TestCase {
        (test: Test): void | Promise<void>;
    }

    /**
     * Available opts options for the tape function.
     */
    interface TestOptions {
        skip?: boolean; // true/false. See test.skip.
        todo?: boolean; // true/false. Test will be allowed to fail.
        timeout?: number; // Set a timeout for the test, after which it will fail. See tape.timeoutAfter.
        /** Max depth when printing objects in assertion output (or Infinity via env). */
        objectPrintDepth?: number | string;
    }

    /**
     * Options for `createHarness()` (not used by the default lazy export).
     */
    interface HarnessOptions {
        autoclose?: boolean;
        noOnly?: boolean;
    }

    /**
     * Options for `getHarness()` when first creating the process harness.
     */
    interface GetHarnessOptions {
        stream?: NodeJS.WritableStream;
        objectMode?: boolean;
        /** When false, skip registering process exit hooks (advanced). */
        exit?: boolean;
        noOnly?: boolean;
    }

    /**
     * Available options for tape assertions.
     */
    interface AssertOptions {
        skip?: boolean | string; // Skip the assertion. Can also be a message explaining why the test is skipped.
        todo?: boolean | string; // Allows the assertion to fail.
        message?: string; // An optional description of the assertion.
    }

    /**
     * Options for the createStream function.
     */
    interface StreamOptions {
        objectMode?: boolean;
    }

    /**
     * A dedicated harness instance (no `wait` / `getHarness` on the callable).
     */
    interface Harness {
        (name: string, cb: TestCase): void;
        (name: string, opts: TestOptions, cb: TestCase): void;
        (cb: TestCase): void;
        (opts: TestOptions, cb: TestCase): void;
        createStream(opts?: StreamOptions): NodeJS.ReadableStream;
        onFinish(cb: () => void): void;
        onFailure(cb: () => void): void;
        only(name: string, cb: TestCase): void;
        only(name: string, opts: TestOptions, cb: TestCase): void;
        only(cb: TestCase): void;
        only(opts: TestOptions, cb: TestCase): void;
        close(): void;
        /** Present when the harness was created with `tape.wait()` + default stream wiring. */
        run?(): void;
        _exitCode: number;
        _tests: Test[];
        _results: any;
    }

    interface CaptureCallRecord {
        args: any[];
        receiver: any;
        returned?: any;
        threw?: boolean;
    }

    interface CaptureResults {
        (): CaptureCallRecord[];
        restore: () => void;
    }

    interface InterceptCall {
        type: 'get' | 'set';
        success: boolean;
        value?: any;
        args: any[];
        receiver: any;
        threw?: boolean;
    }

    interface InterceptResults {
        (): InterceptCall[];
        restore: () => void;
    }

    /**
     * Generate a new test that will be skipped over.
     */
    export function skip(name: string, cb: tape.TestCase): void;
    export function skip(name: string, opts: tape.TestOptions, cb: tape.TestCase): void;
    export function skip(cb: tape.TestCase): void;
    export function skip(opts: tape.TestOptions, cb: tape.TestCase): void;

    /**
     * The onFinish hook will get invoked when ALL tape tests have finished right before tape is about to print the test summary.
     */
    export function onFinish(cb: () => void): void;

    /**
     * The onFailure hook will get invoked whenever any tape tests have failed.
     */
    export function onFailure(cb: () => void): void;

    /**
     * Like test(name?, opts?, cb) except if you use .only this is the only test case that will run for the entire process, all other test cases using tape will be ignored.
     */
    export function only(name: string, cb: tape.TestCase): void;
    export function only(name: string, opts: tape.TestOptions, cb: tape.TestCase): void;
    export function only(cb: tape.TestCase): void;
    export function only(opts: tape.TestOptions, cb: tape.TestCase): void;

    /**
     * Create a new test harness instance, which is a function like test(), but with a new pending stack and test state.
     */
    export function createHarness(opts?: HarnessOptions): Harness;

    /**
     * Create a stream of output, bypassing the default output stream that writes messages to console.log().
     * By default stream will be a text stream of TAP output, but you can get an object stream instead by setting opts.objectMode to true.
     */
    export function createStream(opts?: tape.StreamOptions): NodeJS.ReadableStream;

    interface TestConstructor {
        new (name: string, cb: TestCase): Test;
        new (name: string, opts: TestOptions, cb: TestCase): Test;
        new (cb: TestCase): Test;
        new (opts: TestOptions, cb: TestCase): Test;
        skip(name: string, cb: TestCase): Test;
        skip(name: string, opts: TestOptions, cb: TestCase): Test;
        skip(cb: TestCase): Test;
        skip(opts: TestOptions, cb: TestCase): Test;
    }

    export const Test: TestConstructor;

    interface Test {
        /**
         * Run this test’s callback (normally invoked by the harness). Useful for advanced scenarios.
         */
        run(): void;

        /**
         * Register a function to run when the test ends (or subtest teardown order).
         */
        teardown(fn: () => void): void;

        /**
         * Spy on `obj[method]`; optional `implementation` replaces the original. Returns a `results` function
         * (with `.restore`) that yields captured call records.
         */
        capture(
            obj: object,
            method: string | symbol,
            implementation?: (...args: any[]) => any
        ): CaptureResults;

        /**
         * Wrap a function to record calls on `.calls`.
         */
        captureFn<T extends (...args: any[]) => any>(original: T): T & { calls: CaptureCallRecord[] };

        /**
         * Replace a property with get/set interceptors; returns a `results` function (with `.restore`) of recorded accesses.
         */
        intercept(
            obj: object,
            property: string | symbol,
            desc?: PropertyDescriptor,
            strictMode?: boolean
        ): InterceptResults;

        /**
         * Create a subtest with a new test handle st from cb(st) inside the current test.
         * cb(st) will only fire when t finishes.
         * Additional tests queued up after t will not be run until all subtests finish.
         */
        test(name: string, cb: tape.TestCase): void;
        test(name: string, opts: TestOptions, cb: tape.TestCase): void;

        /**
         * Declare that n assertions should be run. end() will be called automatically after the nth assertion.
         * If there are any more assertions after the nth, or after end() is called, they will generate errors.
         */
        plan(n: number): void;

        /**
         * Declare the end of a test explicitly.
         * If err is passed in t.end will assert that it is falsey.
         */
        end(err?: any): void;

        /**
         * Generate a failing assertion with a message msg.
         */
        fail(msg?: string, extra?: AssertOptions): void;

        /**
         * Generate a passing assertion with a message msg.
         */
        pass(msg?: string, extra?: AssertOptions): void;

        /**
         * Automatically timeout the test after X ms.
         */
        timeoutAfter(ms: number): void;

        /**
         * Generate an assertion that will be skipped over.
         */
        skip(msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that value is truthy with an optional description message msg.
         */
        ok(value: any, msg?: string, extra?: AssertOptions): void;
        true(value: any, msg?: string, extra?: AssertOptions): void;
        assert(value: any, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that value is falsy with an optional description message msg.
         */
        notOk(value: any, msg?: string, extra?: AssertOptions): void;
        false(value: any, msg?: string, extra?: AssertOptions): void;
        notok(value: any, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that err is falsy.
         * If err is non-falsy, use its err.message as the description message.
         */
        error(err: any, msg?: string, extra?: AssertOptions): void;
        ifError(err: any, msg?: string, extra?: AssertOptions): void;
        ifErr(err: any, msg?: string, extra?: AssertOptions): void;
        iferror(err: any, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that a === b with an optional description msg.
         */
        equal(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        equals(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        isEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        is(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        strictEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        strictEquals(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that a !== b with an optional description msg.
         */
        notEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        notEquals(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        notStrictEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        notStrictEquals(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        isNotEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        isNot(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        not(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        doesNotEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        isInequal(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that a and b have the same structure and nested values using node's deepEqual() algorithm with
         * strict comparisons (===) on leaf nodes and an optional description msg.
         */
        deepEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        deepEquals(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        isEquivalent(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        same(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that a and b do not have the same structure and nested values using node's deepEqual() algorithm
         * with strict comparisons (===) on leaf nodes and an optional description msg.
         */
        notDeepEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        notEquivalent(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        notDeeply(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        notSame(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        isNotDeepEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        isNotDeeply(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        isNotEquivalent(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        isInequivalent(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that a and b have the same structure and nested values using node's deepEqual() algorithm with
         * loose comparisons (==) on leaf nodes and an optional description msg.
         */
        deepLooseEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        looseEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        looseEquals(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that a and b do not have the same structure and nested values using node's deepEqual() algorithm
         * with loose comparisons (==) on leaf nodes and an optional description msg.
         */
        notDeepLooseEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        notLooseEqual(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;
        notLooseEquals(actual: any, expected: any, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that the function call fn() throws an exception.
         * expected, if present, must be a RegExp or Function, which is used to test the exception object.
         */
        throws(fn: () => void, msg?: string, extra?: AssertOptions): void;
        throws(fn: () => void, exceptionExpected: RegExp | Function | Object | string, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that the function call fn() does not throw an exception.
         */
        doesNotThrow(fn: () => void, msg?: string, extra?: AssertOptions): void;
        doesNotThrow(fn: () => void, exceptionExpected: RegExp | Function | Object | string, msg?: string, extra?: AssertOptions): void;

        /**
         * Print a message without breaking the tap output.
         * (Useful when using e.g. tap-colorize where output is buffered & console.log will print in incorrect order vis-a-vis tap output.)
         */
        comment(msg?: any): void;

        /**
         * Assert that string matches the RegExp regexp. Will throw (not just fail) when the first two arguments are the wrong type.
         */
        match(actual: string, expected: RegExp, msg?: string, extra?: AssertOptions): void;

        /**
         * Assert that string does not match the RegExp regexp. Will throw (not just fail) when the first two arguments are the wrong type.
         */
        doesNotMatch(actual: string, expected: RegExp, msg?: string, extra?: AssertOptions): void;

        /**
         * Call a custom assertion function with this test as `this` and optional extra arguments.
         * The return value is passed through (e.g. a Promise for async assertions).
         */
        assertion(fn: (this: Test, ...args: any[]) => any, ...args: any[]): any;
    }
}
