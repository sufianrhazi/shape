/**
 * @srhazi/shape: A handy way of asserting the shape of unknown values.
 */

export const version: string = LIB_VERSION;

/**
 * Each IsShape<T> is a function that proves an unknown value is of type T
 */
export type IsShape<T> = (val: unknown) => val is T;

/**
 * Given an IsShape<T> function, ShapeType<typeof isMyShape> gives you the type asserted by the shape.
 */
export type ShapeType<V> = V extends IsShape<infer A> ? A : never;

export const isString: IsShape<string> = (val): val is string =>
    typeof val === 'string';

export const isNumber: IsShape<number> = (val): val is number =>
    typeof val === 'number';

export const isBigint: IsShape<bigint> = (val): val is bigint =>
    typeof val === 'bigint';

export const isBoolean: IsShape<boolean> = (val): val is boolean =>
    typeof val === 'boolean';

export const isSymbol: IsShape<symbol> = (val): val is symbol =>
    typeof val === 'symbol';

export const isUndefined: IsShape<undefined> = (val): val is undefined =>
    val === undefined;

export const isNull: IsShape<null> = (val): val is null => val === null;

export const isArray: IsShape<unknown[]> = (val): val is unknown[] =>
    Array.isArray(val);

export const isFunction: IsShape<() => unknown> = (val): val is () => unknown =>
    typeof val === 'function';

/**
 * Produces a check that the value is exactly the constant provided.
 */
export function isExact<const T>(constant: T): (val: unknown) => val is T {
    return isEnum(constant);
}

/**
 * Produces a check that the value is one of exactly the constants provided.
 */
export function isEnum<const T>(...values: T[]): (val: unknown) => val is T {
    return (val: unknown): val is T => values.some((which) => which === val);
}

/**
 * Produces a check that satisfies one of the provided checks.
 */
export function isEither<X extends IsShape<any>[]>(
    ...checks: X
): (val: unknown) => val is ShapeType<X[number]> {
    return (val: unknown): val is ShapeType<X[number]> => {
        return checks.some((check) => check(val));
    };
}

/**
 * Produces a check that the value is an array of items that satisfy the provided checks.
 */
export function isArrayOf<T>(check: IsShape<T>): (val: unknown) => val is T[] {
    return (val: unknown): val is T[] => {
        return Array.isArray(val) && val.every((item) => check(item));
    };
}

/**
 * Produces a check that the value is an object containing keys that map to checks.
 */
export function isShape<T extends Record<string, IsShape<any>>>(
    shape: T
): IsShape<{ [Key in keyof T]: ShapeType<T[Key]> }> {
    return (val: unknown): val is { [Key in keyof T]: ShapeType<T[Key]> } => {
        if (typeof val !== 'object') {
            return false;
        }
        if (!val) {
            return false;
        }
        for (const [key, check] of Object.entries(shape)) {
            if (!(key in val)) {
                return false;
            }
            if (!check((val as Record<string, any>)[key])) {
                return false;
            }
        }
        return true;
    };
}
