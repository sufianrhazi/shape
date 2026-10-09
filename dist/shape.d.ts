/**
 * @srhazi/shape: A handy way of asserting the shape of unknown values.
 */
export declare const version: string;
/**
 * Each AssertFn<T> is a function that proves an unknown value is of type T
 */
export type AssertFn<T> = (val: unknown) => val is T;
/**
 * Turn an AssertFn<T> type into just T
 */
export type AssertFnType<V> = V extends AssertFn<infer A> ? A : never;
/**
 * Opaque metadata that can be attached to a shape. The library never reads it;
 * consumers can use it to carry descriptions, targets, and other
 * domain-specific annotations through reflection.
 */
export type ShapeMeta = Record<string, unknown>;
/**
 * Bounds for a bounded shape: numeric ranges for numbers/bigints, and length
 * ranges for strings. Bounds are both enforced (validation) and respected by
 * `generate()`.
 */
export type Bounds = {
    min?: number | bigint;
    max?: number | bigint;
    minExclusive?: boolean;
    maxExclusive?: boolean;
    minLength?: number;
    maxLength?: number;
};
/**
 * A reflectable, serializable description of a shape, returned by `specOf()`.
 *
 * The variants mirror the shape combinators. `opaque` is the fallback for a
 * plain assertion function that carries no spec.
 */
export type Spec = {
    kind: 'string';
    minLength?: number;
    maxLength?: number;
} | {
    kind: 'number';
    min?: number;
    max?: number;
    minExclusive?: boolean;
    maxExclusive?: boolean;
} | {
    kind: 'bigint';
    min?: bigint;
    max?: bigint;
    minExclusive?: boolean;
    maxExclusive?: boolean;
} | {
    kind: 'boolean';
} | {
    kind: 'symbol';
} | {
    kind: 'undefined';
} | {
    kind: 'unknown';
} | {
    kind: 'null';
} | {
    kind: 'array';
    minLength?: number;
    maxLength?: number;
} | {
    kind: 'function';
} | {
    kind: 'literal';
    value: unknown;
} | {
    kind: 'enum';
    values: readonly unknown[];
} | {
    kind: 'either';
    options: readonly Spec[];
} | {
    kind: 'arrayOf';
    item: Spec;
    minLength?: number;
    maxLength?: number;
} | {
    kind: 'tuple';
    items: readonly Spec[];
} | {
    kind: 'recordOf';
    value: Spec;
} | {
    kind: 'recordWith';
    entry: Spec;
} | {
    kind: 'shape';
    fields: Readonly<Record<string, FieldSpec>>;
    strict: boolean;
} | {
    kind: 'opaque';
};
/**
 * The description of a single field of an object shape.
 */
export type FieldSpec = {
    spec: Spec;
    optional?: true;
    meta?: ShapeMeta;
};
/**
 * Private configuration carried by a shape (produced by `optional` and
 * `bounded`). It never affects the shape's type; consumers should not need to
 * read it directly.
 */
export type ShapeConfig = {
    optional?: true;
    bounds?: Bounds;
};
/**
 * A shape is an assertion function that also carries a reflectable spec, some
 * opaque metadata, and (when produced by `optional` or `bounded`) private
 * config.
 */
export type Shape<T, C extends ShapeConfig = ShapeConfig> = AssertFn<T> & {
    spec: Spec;
    meta?: ShapeMeta;
    config?: C;
};
/**
 * The result of `check()`: either success, or the first failure with the path
 * to the offending value and a human-readable error.
 *
 * A path of `[]` means the value itself failed; path components correspond to
 * object keys and (stringified) array indices.
 */
export type CheckResult = {
    ok: true;
} | {
    ok: false;
    path: string[];
    error: string;
};
/**
 * Extract the reflectable `Spec` from a shape. A plain assertion function with
 * no attached spec reflects as `{ kind: "opaque" }`.
 */
export declare function specOf(value: unknown): Spec;
/**
 * Extract the metadata attached to a shape (via `withMeta`), if any.
 */
export declare function metaOf(value: unknown): ShapeMeta | undefined;
/**
 * Extract the private config attached to a shape, if any.
 */
export declare function configOf(value: unknown): ShapeConfig | undefined;
/**
 * Check a value against a shape, returning either success or the first failure
 * with a path to the offending value and a human-readable error.
 */
export declare function check<T>(shape: AssertFn<T>, value: unknown): CheckResult;
/**
 * Returns a shape identical to `fn`, with the given metadata attached. The
 * metadata never affects validation; it is carried through reflection.
 */
export declare function withMeta<T, C extends ShapeConfig>(fn: Shape<T, C>, meta: ShapeMeta): Shape<T, C>;
export declare function withMeta<T>(fn: AssertFn<T>, meta: ShapeMeta): Shape<T>;
export declare const isString: Shape<string>;
export declare const isNumber: Shape<number>;
export declare const isBigint: Shape<bigint>;
export declare const isBoolean: Shape<boolean>;
export declare const isSymbol: Shape<symbol>;
export declare const isUndefined: Shape<undefined>;
export declare const isUnknown: Shape<unknown>;
export declare const isNull: Shape<null>;
export declare const isArray: Shape<unknown[]>;
export declare const isFunction: Shape<() => unknown>;
export declare function isTruthy<T>(val: T): val is Exclude<T, 0 | -0 | 0n | '' | null | undefined>;
/**
 * Produces a check that the value is exactly the constant provided.
 */
export declare function isExact<const T>(constant: T): Shape<T>;
/**
 * Produces a check that the value is exactly the constant provided.
 */
export declare const is: typeof isExact;
/**
 * Produces a check that the value is one of exactly the constants provided.
 */
export declare function isEnum<const T>(...values: T[]): Shape<T>;
/**
 * Produces a check that satisfies one of the provided checks.
 */
export declare function isEither<X extends AssertFn<any>[]>(...checks: X): Shape<AssertFnType<X[number]>>;
/**
 * Produces a check that the value is an array of items that satisfy the provided checks.
 */
export declare function isArrayOf<T>(check: AssertFn<T>): Shape<T[]>;
/**
 * Produces a check that the value is an object whose keys all satisfy the provided check
 */
export declare function isRecordOf<T>(isThing: AssertFn<T>): Shape<Record<string, T>>;
/**
 * Produces a check that the value is an object whose entries (keys and values) all satisfy the provided check
 */
export declare function isRecordWith<K extends string | number | symbol, V>(isEntry: AssertFn<[K, V]>): Shape<Record<K, V>>;
/**
 * Produces a check that the value is an arrays whose items all satisfy the provided check
 */
export declare function isTuple<T extends AssertFn<any>[]>(...fns: T): Shape<{
    [P in keyof T]: AssertFnType<T[P]>;
}>;
type OptionalKeys<T extends Record<string, AssertFn<any>>> = {
    [Key in keyof T]: T[Key] extends {
        config?: {
            optional: true;
        };
    } ? Key : never;
}[keyof T];
type ShapeType<T extends Record<string, AssertFn<any>>> = {
    [Key in keyof T as Exclude<Key, OptionalKeys<T>>]: AssertFnType<T[Key]>;
} & {
    [Key in OptionalKeys<T>]?: AssertFnType<T[Key]>;
} extends infer Obj ? {
    [Key in keyof Obj]: Obj[Key];
} : never;
/**
 * Produces a check that the value is an object containing keys that map to checks.
 *
 * When `options.strict` is true, the object must not contain any keys other
 * than the declared ones.
 */
export declare function isShape<T extends Record<string, AssertFn<any>>>(shape: T, options?: {
    strict?: boolean;
}): Shape<ShapeType<T>>;
/**
 * Returns a shape identical to `fn`, but with the given bounds. Bounds are
 * enforced by the returned shape and respected by `generate()`.
 */
export declare function bounded<T, C extends ShapeConfig>(fn: Shape<T, C>, bounds: Bounds): Shape<T, C>;
export declare function bounded<T>(fn: AssertFn<T>, bounds: Bounds): Shape<T, ShapeConfig>;
/**
 * Returns a shape identical to `fn`, marked as an optional (possibly
 * `undefined`) field of an object shape.
 */
export declare function optional<T, C extends ShapeConfig>(fn: Shape<T, C>): Shape<T | undefined, C & {
    optional: true;
}>;
export declare function optional<T>(fn: AssertFn<T>): Shape<T | undefined, {
    optional: true;
}>;
/**
 * Options accepted by `generate()`.
 */
export type GenerateOptions = {
    /** Seed for the built-in PRNG; when provided, output is reproducible. */
    seed?: number;
    /** A random source returning numbers in [0, 1). Defaults to Math.random. */
    rng?: () => number;
    /** How many items to generate for arrays and records (defaults to 0–2). */
    length?: () => number;
};
/**
 * Produce a random value that satisfies the given shape.
 *
 * Generation walks the shape's reflected `Spec`, respecting any bounds
 * attached via `bounded()`. Arbitrary (opaque) assertion functions cannot be
 * generated and throw.
 */
export declare function generate<T>(shape: AssertFn<T>, options?: GenerateOptions): T;
export declare function generate(spec: Spec, options?: GenerateOptions): unknown;
export {};
//# sourceMappingURL=shape.d.ts.map