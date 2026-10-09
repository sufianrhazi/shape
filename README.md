# @srhazi/shape

Composable runtime value checks that play well with TypeScript's type narrowing and tests.

A **shape** is an [**assertion
function**](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions) that
narrows a type.

A **shape** is also a **grammar-based generator** that can build structured, random test data for you.

Think of it like a schema checker for `unknown` values, or a schema-shaped random value generator for tests.


## API

The `@srhazi/shape` package exports the following types and values:

* `Shape<T> = (val: unknown) => val is T` - the type¹ of an **assertion function**

Given an **assertion function**, you can get the type of it with `AssertFnType<typeof myAssertionFunction>`.

There are some self-describing **assertion functions**:

* `isString: Shape<string>`
* `isNumber: Shape<number>`
* `isBigint: Shape<bigint>`
* `isBoolean: Shape<boolean>`
* `isSymbol: Shape<symbol>`
* `isUndefined: Shape<undefined>`
* `isUnknown: Shape<unknown>`
* `isNull: Shape<null>`
* `isArray: Shape<unknown[]>`
* `isFunction: Shape<() => unknown>`

And some helpful **assertion function** factories:

* `isExact(value: T): Shape<T>` - make a function asserting strict equality (`===`) to a specific value
* `is(value: T): Shape<T>` - (alias for `isExact`)
* `isEnum(values...: T[]): Shape<T>` - make a function asserting strict equality (`===`) to one of many values

**Assertion functions** can be combined together with:

* `isShape({ foo: isNumber, bar: isString }): Shape<{ foo: number, bar: string }>` - make a function asserting an object whose keys match the corresponding assertion functions
* `isEither(isString, isNumber, ...etc)` - make a function asserting one of many assertion functions (via OR)
* `isArrayOf: <T>(shape: AssertFn<T>) => Shape<T[]>` - make a function asserting an array whose values all match an assertion function
* `isTuple: <T extends AssertFn<any>[]>(...fns: T) => Shape<{ [P in keyof T]: AssertFnType<T[P]>; }>` - make a function asserting a tuple (fixed-length array) whose values each match the assertion functions
* `isRecordOf: <T>(shape: AssertFn<T>) => Shape<Record<string, T>>` - make a function asserting an object whose
  values all match an assertion function
* `isRecordWith: <K extends string | number | symbol, V>(isEntry: AssertFn<[K, V]>): Shape<Record<K, V>>` - make a function asserting an object whose
  entries all match an assertion function

And there's one hard-to-describe, but easy-to-use **assertion function**:

* `function isTruthy<T>(val: T): val is Exclude<T, 0 | -0 | 0n | "" | null | undefined>` - make a function asserting
  just like how `if` works

And if you want a shape with an optional property, mark the **assertion function** with `optional`:

* `optional<T>(fn: AssertFn<T>): Shape<T | undefined>` - make a property optional

If you want to constrain numeric values allows strings, arrays and other kinds can be constrained with `bounded`:

* `bounded<T>(fn: AssertFn<T>, bounds: Bounds): Shape<T>` - enforce `bounds` on a shape (`min`, `max`, `minLength`, `maxLength`, `minExclusive`, `maxExclusive`)

But wait, there's more! If you have one of these shapes, you can generate random matching data with:

* `generate(shape: AssertFn<T>, options?: { seed?: number; rng?: () => number; length?: () => number; }): T` - make a random value of that shape ( `seed` makes output repeatable; `length` can force specific lengths for strings and arrays

You can also attach/retrieve arbitrary metadata to shapes with:

* `withMeta(fn: AssertFn<T>, meta: ShapeMeta): Shape<T>` - attach metadata
* `metaOf(fn: AssertFn<T>): ShapeMeta | undefined` - read the metadata attached to a shape

And shapes are self-describing, so you can reflect on them:

* `specOf(fn: AssertFn<T>): Spec` - describe a shape as data; a plain **assertion function** reflects as `{ kind: 'opaque' }`

And when a value doesn't satisfy a shape, `check` tells you where it went wrong:

* `check(shape: AssertFn<T>, value: unknown): CheckResult` - find the first failure, with a path to the offending value

`CheckResult` is either `{ ok: true }` or `{ ok: false, path: string[], error: string }`. A `path` of `[]` means the value itself failed; each path component is an object key or a (stringified) array index.

Under the hood, there are some type differences you may notice. Feel free to ignore these in day-to-day use:

* `AssertFn<T>` - a TypeScript assertion function
* `Shape<T>` - a `@srhazi/shape` assertion function (has a spec & metadata)
* `AnnotatedShape<T>` - a shape with private config, used by `optional` and `bounded`


Notes: 

* ¹ - `Shape<T>` has extra metadata associated with it - also called `AssertFn<T>` without that metadata
* I overly simplified some return types - some functions return `AnnotatedShape<T>` - don't worry about it

## Installation

`npm install --save @srhazi/shape`


## AI Disclosure

Version 1.4.0 was created by me.

Version 1.5.0 was created with assistance from a Large Language Model.

Version 2.0.0 was created with assistance from a Large Language Model.

AI only makes slop if you don't care about it. I care about this, so it isn't slop.
