/**
 * @srhazi/shape: A handy way of asserting the shape of unknown values.
 */
export declare const version: string;
/**
 * Each IsShape<T> is a function that proves an unknown value is of type T
 */
export type IsShape<T> = (val: unknown) => val is T;
/**
 * Given an IsShape<T> function, ShapeType<typeof isMyShape> gives you the type asserted by the shape.
 */
export type ShapeType<V> = V extends IsShape<infer A> ? A : never;
export declare const isString: IsShape<string>;
export declare const isNumber: IsShape<number>;
export declare const isBigint: IsShape<bigint>;
export declare const isBoolean: IsShape<boolean>;
export declare const isSymbol: IsShape<symbol>;
export declare const isUndefined: IsShape<undefined>;
export declare const isNull: IsShape<null>;
export declare const isArray: IsShape<unknown[]>;
export declare const isFunction: IsShape<() => unknown>;
/**
 * Produces a check that the value is exactly the constant provided.
 */
export declare function isExact<const T>(constant: T): (val: unknown) => val is T;
/**
 * Produces a check that the value is one of exactly the constants provided.
 */
export declare function isEnum<const T>(...values: T[]): (val: unknown) => val is T;
/**
 * Produces a check that satisfies one of the provided checks.
 */
export declare function isEither<X extends IsShape<any>[]>(...checks: X): (val: unknown) => val is ShapeType<X[number]>;
/**
 * Produces a check that the value is an array of items that satisfy the provided checks.
 */
export declare function isArrayOf<T>(check: IsShape<T>): (val: unknown) => val is T[];
/**
 * Produces a check that the value is an object containing keys that map to checks.
 */
export declare function isShape<T extends Record<string, IsShape<any>>>(shape: T): IsShape<{
    [Key in keyof T]: ShapeType<T[Key]>;
}>;
//# sourceMappingURL=shape.d.ts.map