import { assert, suite, test } from '@srhazi/gooey-test';

import {
    bounded,
    check,
    generate,
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
    isUnknown,
    metaOf,
    optional,
    specOf,
    withMeta,
} from './shape';
import type { AssertFn } from './shape';

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

suite('reflection (specOf)', () => {
    test('primitives', () => {
        assert.deepEqual({ kind: 'string' }, specOf(isString));
        assert.deepEqual({ kind: 'number' }, specOf(isNumber));
        assert.deepEqual({ kind: 'boolean' }, specOf(isBoolean));
    });

    test('literal, enum, either, arrayOf', () => {
        assert.deepEqual(
            { kind: 'literal', value: 'foo' },
            specOf(isExact('foo'))
        );
        assert.deepEqual(
            { kind: 'enum', values: ['a', 'b'] },
            specOf(isEnum('a', 'b'))
        );
        assert.deepEqual(
            {
                kind: 'either',
                options: [{ kind: 'string' }, { kind: 'number' }],
            },
            specOf(isEither(isString, isNumber))
        );
        assert.deepEqual(
            { kind: 'arrayOf', item: { kind: 'string' } },
            specOf(isArrayOf(isString))
        );
    });

    test('shape fields, optionality, and strictness', () => {
        assert.deepEqual(
            {
                kind: 'shape',
                strict: true,
                fields: {
                    name: { spec: { kind: 'string' } },
                    age: { spec: { kind: 'number' }, optional: true },
                },
            },
            specOf(
                isShape(
                    { name: isString, age: optional(isNumber) },
                    { strict: true }
                )
            )
        );
    });

    test('an opaque assertion function reflects as opaque', () => {
        const custom: AssertFn<number> = (v): v is number =>
            typeof v === 'number';
        assert.deepEqual({ kind: 'opaque' }, specOf(custom));
    });

    test('field metadata reflects', () => {
        const described = withMeta(isString, { description: 'a name' });
        assert.deepEqual({ description: 'a name' }, metaOf(described));
        assert.deepEqual(
            {
                kind: 'shape',
                strict: false,
                fields: {
                    name: {
                        spec: { kind: 'string' },
                        meta: { description: 'a name' },
                    },
                },
            },
            specOf(isShape({ name: described }))
        );
    });
});

suite('withMeta', () => {
    test('carries metadata without changing validation or mutating the source', () => {
        const described = withMeta(isString, { description: 'a name' });
        assert.is(true, described('x'));
        assert.is(false, described(3));
        assert.deepEqual({ description: 'a name' }, described.meta);
        assert.is(undefined, isString.meta);
        assert.deepEqual({ kind: 'string' }, specOf(described));
    });

    test('an annotated optional shape stays optional', () => {
        const described = withMeta(optional(isNumber), { description: 'n' });
        const shape = isShape({ n: described });
        assert.is(true, shape({}));
        assert.is(true, shape({ n: 3 }));
        assert.is(false, shape({ n: 'x' }));
        assert.deepEqual({ kind: 'number' }, specOf(described));
    });
});

suite('strict shapes', () => {
    test('reject undeclared keys only when strict', () => {
        const loose = isShape({ a: isString });
        const strict = isShape({ a: isString }, { strict: true });
        assert.is(true, loose({ a: 'x', extra: 1 }));
        assert.is(false, strict({ a: 'x', extra: 1 }));
        assert.is(true, strict({ a: 'x' }));
    });
});

suite('generate', () => {
    test('generated values satisfy their shape', () => {
        const shapes: AssertFn<unknown>[] = [
            isString,
            isNumber,
            isBigint,
            isBoolean,
            isSymbol,
            isNull,
            isUndefined,
            isUnknown,
            isArray,
            isFunction,
            isExact('foo'),
            isEnum('a', 'b'),
            isArrayOf(isNumber),
            isTuple(isString, isNumber),
            isEither(isString, isNumber),
            isRecordOf(isBoolean),
            isRecordWith(isTuple(isEnum('a', 'b'), isNumber)),
            isShape({ name: isString, age: optional(isNumber) }),
        ];
        for (const shape of shapes) {
            assert.is(true, shape(generate(shape, { seed: 1 })));
        }
    });

    test('an optional field that cannot be generated is omitted', () => {
        const custom: AssertFn<number> = (v): v is number =>
            typeof v === 'number';
        const shape = isShape({ name: isString, ref: optional(custom) });
        const value = generate(shape, { seed: 1 }) as { ref?: number };
        assert.is(true, shape(value));
        assert.is(false, 'ref' in value);
    });

    test('empty enums and empty eithered shapes cannot be generated', () => {
        assert.throwsMatching(/empty enum/, () => generate(isEnum()));
        assert.throwsMatching(/no option/, () => generate(isEither()));
    });

    test('the length option controls collection size', () => {
        const value = generate(isArrayOf(isNumber), {
            seed: 1,
            length: () => 3,
        });
        assert.is(3, (value as number[]).length);
    });

    test('seeded generation is reproducible', () => {
        const shape = isShape({ name: isString, tags: isArrayOf(isString) });
        assert.deepEqual(
            generate(shape, { seed: 42 }),
            generate(shape, { seed: 42 })
        );
    });

    test('opaque shapes cannot be generated', () => {
        const custom: AssertFn<number> = (v): v is number =>
            typeof v === 'number';
        assert.throwsMatching(/opaque/, () => generate(custom));
    });

    test('a recordWith with non-string keys cannot be generated', () => {
        assert.throwsMatching(/keys are not strings/, () =>
            generate(isRecordWith(isTuple(isEnum(1, 2), isNumber)))
        );
    });
});

suite('bounded', () => {
    test('enforces numeric bounds', () => {
        const count = bounded(isNumber, { min: 1, max: 3 });
        assert.is(true, count(1));
        assert.is(true, count(3));
        assert.is(false, count(0));
        assert.is(false, count(4));
        assert.is(false, count('2'));
    });

    test('supports exclusive bounds', () => {
        const count = bounded(isNumber, {
            min: 1,
            max: 3,
            minExclusive: true,
            maxExclusive: true,
        });
        assert.is(false, count(1));
        assert.is(true, count(2));
        assert.is(false, count(3));
    });

    test('enforces string length', () => {
        const name = bounded(isString, { minLength: 2, maxLength: 4 });
        assert.is(true, name('ab'));
        assert.is(true, name('abcd'));
        assert.is(false, name('a'));
        assert.is(false, name('abcde'));
    });

    test('bounds are reflected', () => {
        const spec = specOf(bounded(isNumber, { min: 1, max: 3 }));
        assert.is('number', spec.kind);
        if (spec.kind === 'number') {
            assert.is(1, spec.min);
            assert.is(3, spec.max);
        }
        const stringSpec = specOf(bounded(isString, { minLength: 2 }));
        assert.is('string', stringSpec.kind);
        if (stringSpec.kind === 'string') {
            assert.is(2, stringSpec.minLength);
        }
    });

    test('rejects bounds that do not fit the shape', () => {
        assert.throwsMatching(/minLength/, () =>
            bounded(isNumber, { minLength: 1 })
        );
        assert.throwsMatching(/min\b/, () => bounded(isString, { min: 1 }));
        assert.throwsMatching(/not supported/, () =>
            bounded(isBoolean, { min: 1 })
        );
    });

    test('generates within bounds', () => {
        const count = bounded(isNumber, { min: 5, max: 6 });
        for (let seed = 0; seed < 20; seed += 1) {
            const value = generate(count, { seed });
            assert.is(true, value >= 5 && value <= 6);
            assert.is(true, count(value));
        }
        const name = bounded(isString, { minLength: 2, maxLength: 3 });
        for (let seed = 0; seed < 20; seed += 1) {
            const value = generate(name, { seed });
            assert.is(true, value.length >= 2 && value.length <= 3);
        }
    });

    test('composes with optional', () => {
        const shape = isShape({
            count: optional(bounded(isNumber, { min: 0 })),
        });
        assert.is(true, shape({}));
        assert.is(true, shape({ count: 0 }));
        assert.is(false, shape({ count: -1 }));
    });

    test('merges bounds across repeated application', () => {
        const count = bounded(bounded(isNumber, { min: 5 }), { max: 10 });
        assert.is(false, count(4));
        assert.is(true, count(5));
        assert.is(true, count(10));
        assert.is(false, count(11));
        const spec = specOf(count);
        assert.is('number', spec.kind);
        if (spec.kind === 'number') {
            assert.is(5, spec.min);
            assert.is(10, spec.max);
        }
        for (let seed = 0; seed < 20; seed += 1) {
            const value = generate(count, { seed });
            assert.is(true, value >= 5 && value <= 10);
        }
    });

    test('rejects invalid bound values', () => {
        assert.throwsMatching(/non-negative integer/, () =>
            bounded(isString, { minLength: -1 })
        );
        assert.throwsMatching(/non-negative integer/, () =>
            bounded(isString, { maxLength: 1.5 })
        );
        assert.throwsMatching(/finite number/, () =>
            bounded(isNumber, { min: Number.NaN })
        );
    });

    test('enforces array length', () => {
        const list = bounded(isArrayOf(isNumber), {
            minLength: 2,
            maxLength: 3,
        });
        assert.is(true, list([1, 2]));
        assert.is(true, list([1, 2, 3]));
        assert.is(false, list([1]));
        assert.is(false, list([1, 2, 3, 4]));
        assert.is(false, list([1, 'x', 3]));
    });

    test('array bounds are reflected and generated', () => {
        const list = bounded(isArrayOf(isNumber), {
            minLength: 2,
            maxLength: 3,
        });
        const spec = specOf(list);
        assert.is('arrayOf', spec.kind);
        if (spec.kind === 'arrayOf') {
            assert.is(2, spec.minLength);
            assert.is(3, spec.maxLength);
        }
        for (let seed = 0; seed < 20; seed += 1) {
            const value = generate(list, { seed });
            assert.is(true, value.length >= 2 && value.length <= 3);
            assert.is(true, list(value));
        }
        const anyList = bounded(isArray, { maxLength: 1 });
        for (let seed = 0; seed < 20; seed += 1) {
            assert.is(true, generate(anyList, { seed }).length <= 1);
        }
    });

    test('rejects min/max on arrays', () => {
        assert.throwsMatching(/do not apply to an array/, () =>
            bounded(isArrayOf(isNumber), { min: 1 })
        );
    });
});

suite('check', () => {
    test('reports success', () => {
        assert.deepEqual({ ok: true }, check(isString, 'hello'));
    });

    test('reports a top-level failure with an empty path', () => {
        assert.deepEqual(
            { ok: false, path: [], error: 'expected string' },
            check(isString, 3)
        );
    });

    test('reports the path to a failing object field', () => {
        const shape = isShape({
            user: isShape({ name: isString, age: isNumber }),
        });
        assert.deepEqual(
            { ok: false, path: ['user', 'age'], error: 'expected number' },
            check(shape, { user: { name: 'ada', age: 'old' } })
        );
        assert.deepEqual(
            {
                ok: false,
                path: ['user', 'name'],
                error: 'missing required property',
            },
            check(shape, { user: { age: 3 } })
        );
    });

    test('reports array indices in the path', () => {
        assert.deepEqual(
            { ok: false, path: ['1'], error: 'expected number' },
            check(isArrayOf(isNumber), [1, 'two', 3])
        );
    });

    test('reports bound violations with a path', () => {
        const shape = isShape({ age: bounded(isNumber, { min: 0, max: 120 }) });
        assert.deepEqual(
            { ok: false, path: ['age'], error: 'expected number <= 120' },
            check(shape, { age: 200 })
        );
    });

    test('reports an unexpected property in strict mode', () => {
        const shape = isShape({ name: isString }, { strict: true });
        assert.deepEqual(
            { ok: false, path: ['extra'], error: 'unexpected property' },
            check(shape, { name: 'ada', extra: 1 })
        );
    });

    test('reports a failed custom check', () => {
        const isEven: AssertFn<number> = (v): v is number =>
            typeof v === 'number' && v % 2 === 0;
        assert.deepEqual(
            { ok: false, path: [], error: 'failed custom check' },
            check(isEven, 3)
        );
    });

    test('rejects sparse arrays, matching the guard', () => {
        const shape = isArrayOf(isNumber);
        const sparse: number[] = [1];
        sparse[2] = 3;
        assert.is(false, shape(sparse));
        assert.deepEqual(
            { ok: false, path: ['1'], error: 'unexpected empty slot' },
            check(shape, sparse)
        );
        const holeyUnknown = isArrayOf(isUnknown);
        assert.is(false, holeyUnknown(sparse));
        assert.deepEqual(
            { ok: false, path: ['1'], error: 'unexpected empty slot' },
            check(holeyUnknown, sparse)
        );
    });

    test('agrees with the guard', () => {
        const shape = isShape({
            a: isString,
            b: optional(bounded(isNumber, { min: 0 })),
        });
        const values: unknown[] = [
            { a: 'x' },
            { a: 'x', b: 0 },
            { a: 'x', b: -1 },
            { a: 1 },
            {},
            'nope',
            null,
        ];
        for (const value of values) {
            assert.is(shape(value), check(shape, value).ok);
        }
    });

    test('reports array-length violations with a path', () => {
        const shape = isShape({
            tags: bounded(isArrayOf(isString), { minLength: 2 }),
        });
        assert.deepEqual(
            {
                ok: false,
                path: ['tags'],
                error: 'expected array with length >= 2',
            },
            check(shape, { tags: ['a'] })
        );
    });
});
