/**
 * @srhazi/shape: A handy way of asserting the shape of unknown values.
 */
export declare const version: string;
/**
 * Each AssertFn<T> is a function that proves an unknown value is of type T
 */
export type AssertFn<T> = (val: unknown) => val is T;
export type OptionalAssertFn<T> = AssertFn<T> & {
    __optional: true;
};
/**
 * Turn an AssertFn<T> type into just T
 */
export type AssertFnType<V> = V extends AssertFn<infer A> ? A : never;
export declare const isString: AssertFn<string>;
export declare const isNumber: AssertFn<number>;
export declare const isBigint: AssertFn<bigint>;
export declare const isBoolean: AssertFn<boolean>;
export declare const isSymbol: AssertFn<symbol>;
export declare const isUndefined: AssertFn<undefined>;
export declare const optional: <T>(fn: AssertFn<T>) => OptionalAssertFn<T | undefined>;
export declare const isUnknown: AssertFn<unknown>;
export declare const isNull: AssertFn<null>;
export declare const isArray: AssertFn<unknown[]>;
export declare const isFunction: AssertFn<() => unknown>;
export declare function isTruthy<T>(val: T): val is Exclude<T, 0 | -0 | 0n | '' | null | undefined>;
/**
 * Produces a check that the value is exactly the constant provided.
 */
export declare function isExact<const T>(constant: T): (val: unknown) => val is T;
/**
 * Produces a check that the value is exactly the constant provided.
 */
export declare const is: typeof isExact;
/**
 * Produces a check that the value is one of exactly the constants provided.
 */
export declare function isEnum<const T>(...values: T[]): (val: unknown) => val is T;
/**
 * Produces a check that satisfies one of the provided checks.
 */
export declare function isEither<X extends AssertFn<any>[]>(...checks: X): (val: unknown) => val is AssertFnType<X[number]>;
/**
 * Produces a check that the value is an array of items that satisfy the provided checks.
 */
export declare function isArrayOf<T>(check: AssertFn<T>): (val: unknown) => val is T[];
/**
 * Produces a check that the value is an object whose keys all satisfy the provided check
 */
export declare function isRecordOf<T>(isThing: AssertFn<T>): (record: unknown) => record is Record<string, T>;
/**
 * Produces a check that the value is an object whose entries (keys and values) all satisfy the provided check
 */
export declare function isRecordWith<K extends string | number | symbol, V>(isEntry: AssertFn<[K, V]>): (record: unknown) => record is Record<K, V>;
/**
 * Produces a check that the value is an object whose entries (keys and values) all satisfy the provided check
 */
export declare function isTuple<K, V>(isLeft: AssertFn<K>, isRight: AssertFn<V>): (pair: unknown) => pair is [K, V];
type OptionalKeys<T extends Record<string, OptionalAssertFn<any> | AssertFn<any>>> = {
    [Key in keyof T]: T[Key] extends OptionalAssertFn<any> ? Key : never;
}[keyof T];
type ShapeType<T extends Record<string, OptionalAssertFn<any> | AssertFn<any>>> = {
    [Key in keyof T as Exclude<Key, OptionalKeys<T>>]: T[Key] extends AssertFn<infer V> ? V : never;
} & {
    [Key in OptionalKeys<T>]?: T[Key] extends OptionalAssertFn<infer V> ? V : unknown;
} extends infer Obj ? {
    [Key in keyof Obj]: Obj[Key];
} : never;
/**
 * Produces a check that the value is an object containing keys that map to checks.
 */
export declare function isShape<T extends Record<string, OptionalAssertFn<any> | AssertFn<any>>>(shape: T): AssertFn<ShapeType<T>>;
export {};
//# sourceMappingURL=shape.d.ts.map