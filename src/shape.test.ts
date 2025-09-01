import { assert, suite, test } from '@srhazi/gooey-test';

import {
    isArray,
    isArrayOf,
    isBigint,
    isBoolean,
    isEither,
    isEnum,
    isExact,
    isFunction,
    isNull,
    isNumber,
    isRecordOf,
    isRecordWith,
    isShape,
    isString,
    isSymbol,
    isTuple,
    isUndefined,
    optional,
} from './shape';

type AssertIs<T, V> = T extends V ? (V extends T ? true : false) : false;
function assertType<T, V>(_isTrue: AssertIs<T, V>) {}

suite('isArrayOf', () => {
    test('numbers', () => {
        assert.is(true, isArrayOf(isNumber)([1, 2, 3]));
        assert.is(false, isArrayOf(isNumber)([1, 'a', 3]));
    });

    test('mixed fails', () => {
        assert.is(false, isArrayOf(isNumber)([1, 'a', 3]));
    });

    test('empty passes', () => {
        assert.is(true, isArrayOf(isNumber)([]));
    });

    test('nonarray fails', () => {
        assert.is(false, isArrayOf(isNumber)({ 0: 0, length: 1 }));
    });
});

suite('isRecordOf', () => {
    test('numbers', () => {
        assert.is(true, isRecordOf(isNumber)({ foo: 1, bar: 2, baz: 3 }));
        assert.is(false, isRecordOf(isNumber)([1, 2, 3]));
        assert.is(false, isRecordOf(isNumber)({ foo: 1, bar: 'a', baz: 3 }));
    });

    test('empty passes', () => {
        assert.is(true, isRecordOf(isNumber)({}));
    });
});

suite('isRecordWith / isTuple', () => {
    test('keys and values', () => {
        const assertFn = isRecordWith(
            isTuple(isEnum('foo', 'bar', 'baz'), isNumber)
        );
        assert.is(
            true,
            assertFn({
                foo: 1,
                bar: 2,
                baz: 3,
            })
        );
        assert.is(
            false,
            assertFn({
                foo: 1,
                bar: 'nope',
                baz: 3,
            })
        );
        assert.is(
            false,
            assertFn({
                foo: 1,
                bar: 2,
                baz: 3,
                bum: 4,
            })
        );
        assert.is(false, assertFn([1, 2, 3]));
        assert.is(false, assertFn({ foo: 1, bar: 'a', baz: 3 }));
    });

    test('empty passes', () => {
        const assertFn = isRecordWith(
            isTuple(isEnum('foo', 'bar', 'baz'), isNumber)
        );
        assert.is(true, assertFn({}));
    });
});

suite('isTuple', () => {
    const isStringTuple = isTuple(isString);
    const isStringNumberTuple = isTuple(isString, isNumber);
    const isFooStringBarNumberTuple = isTuple(
        isExact('foo'),
        isString,
        isExact('bar'),
        isNumber
    );

    test('1 entry', () => {
        assert.is(false, isStringTuple([]));
        assert.is(true, isStringTuple(['hello']));
        assert.is(false, isStringTuple([3]));
        assert.is(false, isStringTuple(['hello', 3]));
    });

    test('2 entries', () => {
        assert.is(false, isStringNumberTuple(['hi']));
        assert.is(false, isStringNumberTuple(['hello', 'hey']));
        assert.is(true, isStringNumberTuple(['hello', 3]));
        assert.is(false, isStringNumberTuple(['hello', 3, 'hey']));

        const x: unknown = null;
        if (isStringNumberTuple(x)) {
            // Type checking for 2-tuple
            assertType<[string, number], typeof x>(true);
        }
    });

    test('multiple entries', () => {
        assert.is(true, isFooStringBarNumberTuple(['foo', 'hello', 'bar', 5]));
        assert.is(false, isFooStringBarNumberTuple(['foo', 4, 'bar', 5]));
        assert.is(
            false,
            isFooStringBarNumberTuple(['foo', 'hey', 'bar', 'howdy'])
        );

        const x: unknown = null;
        if (isFooStringBarNumberTuple(x)) {
            // Type checking for variadic tuples
            assertType<['foo', string, 'bar', number], typeof x>(true);
        }
    });
});

suite('basic checks', () => {
    [
        [false, 'hi'],
        [false, ''],
        [true, 3],
        [false, {}],
        [false, undefined],
        [false, 3n],
        [false, false],
        [false, true],
        [false, []],
        [false, Symbol('hi')],
        [false, Symbol.hasInstance],
        [false, Symbol.for('hey')],
        [false, null],
        [false, Array.isArray],
    ].forEach(([expected, value]) =>
        test(`isNumber: ${value?.toString() ?? 'undefined'}`, () => {
            assert.is(expected, isNumber(value));
        })
    );

    [
        [true, 'hi'],
        [true, ''],
        [false, 3],
        [false, {}],
        [false, undefined],
        [false, 3n],
        [false, false],
        [false, true],
        [false, []],
        [false, Symbol('hi')],
        [false, Symbol.hasInstance],
        [false, Symbol.for('hey')],
        [false, null],
        [false, Array.isArray],
    ].forEach(([expected, value]) =>
        test(`isString: ${value?.toString() ?? 'undefined'}`, () => {
            assert.is(expected, isString(value));
        })
    );

    [
        [false, 'hi'],
        [false, ''],
        [false, 3],
        [false, {}],
        [false, undefined],
        [true, 3n],
        [false, false],
        [false, true],
        [false, []],
        [false, Symbol('hi')],
        [false, Symbol.hasInstance],
        [false, Symbol.for('hey')],
        [false, null],
        [false, Array.isArray],
    ].forEach(([expected, value]) =>
        test(`isBigint: ${value?.toString() ?? 'undefined'}`, () => {
            assert.is(expected, isBigint(value));
        })
    );

    [
        [false, 'hi'],
        [false, ''],
        [false, 3],
        [false, {}],
        [false, undefined],
        [false, 3n],
        [true, false],
        [true, true],
        [false, []],
        [false, Symbol('hi')],
        [false, Symbol.hasInstance],
        [false, Symbol.for('hey')],
        [false, null],
        [false, Array.isArray],
    ].forEach(([expected, value]) =>
        test(`isBoolean: ${value?.toString() ?? 'undefined'}`, () => {
            assert.is(expected, isBoolean(value));
        })
    );

    [
        [false, 'hi'],
        [false, ''],
        [false, 3],
        [false, {}],
        [false, undefined],
        [false, 3n],
        [false, false],
        [false, true],
        [false, []],
        [true, Symbol('hi')],
        [true, Symbol.hasInstance],
        [true, Symbol.for('hey')],
        [false, null],
        [false, Array.isArray],
    ].forEach(([expected, value]) =>
        test(`isSymbol: ${value?.toString() ?? 'undefined'}`, () => {
            assert.is(expected, isSymbol(value));
        })
    );

    [
        [false, 'hi'],
        [false, ''],
        [false, 3],
        [false, {}],
        [false, undefined],
        [false, 3n],
        [false, false],
        [false, true],
        [false, []],
        [false, Symbol('hi')],
        [false, Symbol.hasInstance],
        [false, Symbol.for('hey')],
        [true, null],
        [false, Array.isArray],
    ].forEach(([expected, value]) =>
        test(`isNull: ${value?.toString() ?? 'undefined'}`, () => {
            assert.is(expected, isNull(value));
        })
    );

    [
        [false, 'hi'],
        [false, ''],
        [false, 3],
        [false, {}],
        [false, undefined],
        [false, 3n],
        [false, false],
        [false, true],
        [true, []],
        [false, Symbol('hi')],
        [false, Symbol.hasInstance],
        [false, Symbol.for('hey')],
        [false, null],
        [false, Array.isArray],
    ].forEach(([expected, value]) =>
        test(`isArray: ${value?.toString() ?? 'undefined'}`, () => {
            assert.is(expected, isArray(value));
        })
    );

    [
        [false, 'hi'],
        [false, ''],
        [false, 3],
        [false, {}],
        [true, undefined],
        [false, 3n],
        [false, false],
        [false, true],
        [false, []],
        [false, Symbol('hi')],
        [false, Symbol.hasInstance],
        [false, Symbol.for('hey')],
        [false, null],
        [false, Array.isArray],
    ].forEach(([expected, value]) =>
        test(`isUndefined: ${value?.toString() ?? 'undefined'}`, () => {
            assert.is(expected, isUndefined(value));
        })
    );

    [
        [false, 'hi'],
        [false, ''],
        [false, 3],
        [false, {}],
        [false, undefined],
        [false, 3n],
        [false, false],
        [false, true],
        [false, []],
        [false, Symbol('hi')],
        [false, Symbol.hasInstance],
        [false, Symbol.for('hey')],
        [false, null],
        [true, Array.isArray],
    ].forEach(([expected, value]) =>
        test(`isFunction: ${value?.toString() ?? 'undefined'}`, () => {
            assert.is(expected, isFunction(value));
        })
    );
});

suite('isShape, isEither, isEnum', () => {
    const isMyThing = isEither(
        isShape({
            type: isExact('number'),
            value: isNumber,
        }),
        isShape({
            type: isExact('string'),
            value: isString,
        }),
        isShape({
            type: isExact('foobarbaz'),
            value: isEnum('foo', 'bar', 'baz'),
        })
    );

    test('basic functionality', () => {
        assert.is(true, isMyThing({ type: 'number', value: 3 }));
        assert.is(false, isMyThing({ type: 'number', value: '3' }));
        assert.is(false, isMyThing({ type: 'number', value: 'bar' }));
        assert.is(false, isMyThing({ type: 'string', value: 3 }));
        assert.is(true, isMyThing({ type: 'string', value: '3' }));
        assert.is(true, isMyThing({ type: 'string', value: 'bar' }));
        assert.is(false, isMyThing({ type: 'foobarbaz', value: 3 }));
        assert.is(false, isMyThing({ type: 'foobarbaz', value: '3' }));
        assert.is(true, isMyThing({ type: 'foobarbaz', value: 'bar' }));
        assert.is(false, isMyThing({ type: 'nope', value: 3 }));
        assert.is(false, isMyThing({ type: 'nope', value: '3' }));
        assert.is(false, isMyThing({ type: 'nope', value: 'bar' }));
    });
});

suite('optional', () => {
    const isMyThing = isShape({
        required: isExact('foo'),
        optional: optional(isExact('bar')),
    });

    test('basic functionality', () => {
        assert.is(true, isMyThing({ required: 'foo' }));
        assert.is(true, isMyThing({ required: 'foo', optional: undefined }));
        assert.is(true, isMyThing({ required: 'foo', optional: 'bar' }));
        assert.is(false, isMyThing({ required: 'foo', optional: 'baz' }));
    });
});
