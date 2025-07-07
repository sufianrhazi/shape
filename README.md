# @srhazi/shape

Composable runtime value checks that play well with TypeScript's type narrowing.

A **shape** is an [**assertion
function**](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions) that
narrows a type.

Think of it like a schema checker for `unknown` values.


## API

The `@srhazi/shape` package exports the following types and values:

* `AssertFn<T> = (val: unknown) => val is T` - the type of an **assertion function** 

Given an **assertion function**, you can get the type of it with `AssertFnType<typeof myAssertionFunction>`.

There are some self-describing **assertion functions**:

* `isString: AssertFn<string>`
* `isNumber: AssertFn<string>`
* `isNumber: AssertFn<number>`
* `isBigint: AssertFn<bigint>`
* `isBoolean: AssertFn<boolean>`
* `isSymbol: AssertFn<symbol>`
* `isUndefined: AssertFn<undefined>`
* `isUnknown: AssertFn<unknown>`
* `isNull: AssertFn<null>`
* `isArray: AssertFn<unknown[]>`
* `isFunction: AssertFn<() => unknown>`

And some helpful **assertion function** factories:

* `isExact(value: T): AssertFn<T>` - make a function asserting strict equality (`===`) to a specific value
* `is(value: T): AssertFn<T>` - (alias for `isExact`)
* `isEnum(values...: T[]): AssertFn<T>` - make a function asserting strict equality (`===`) to one of many values

**Assertion functions** can be combined together with:

* `isShape({ foo: isNumber, bar: isString }): AssertFn<{ foo: number, bar: string }>` - make a function asserting an object whose keys match the corresponding assertion functions
* `isEither(isString, isNumber, ...etc)` - make a function asserting one of many assertion functions (via OR)
* `isArrayOf: <T>(shape: AssertFn<T>) => AssertFn<T[]>` - make a function asserting an array whose values all match an assertion function
* `isRecordOf: <T>(shape: AssertFn<T>) => AssertFn<Record<string, T>>` - make a function asserting an object whose
  values all match an assertion function

And there's one hard-to-describe, but easy-to-use **assertion function**:

* `function isTruthy<T>(val: T): val is Exclude<T, 0 | -0 | 0n | "" | null | undefined>` - make a function asserting
  just like how `if` works


## Installation

`npm install --save @srhazi/shape`
