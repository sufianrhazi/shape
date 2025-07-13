/**
 * @srhazi/shape: A handy way of asserting the shape of unknown values.
 */

export const version: string = LIB_VERSION;

/**
 * Each AssertFn<T> is a function that proves an unknown value is of type T
 */
export type AssertFn<T> = (val: unknown) => val is T;

/**
 * Turn an AssertFn<T> type into just T
 */
export type AssertFnType<V> = V extends AssertFn<infer A> ? A : never;

export const isString: AssertFn<string> = (val): val is string =>
    typeof val === 'string';

export const isNumber: AssertFn<number> = (val): val is number =>
    typeof val === 'number';

export const isBigint: AssertFn<bigint> = (val): val is bigint =>
    typeof val === 'bigint';

export const isBoolean: AssertFn<boolean> = (val): val is boolean =>
    typeof val === 'boolean';

export const isSymbol: AssertFn<symbol> = (val): val is symbol =>
    typeof val === 'symbol';

export const isUndefined: AssertFn<undefined> = (val): val is undefined =>
    val === undefined;

export const isUnknown: AssertFn<unknown> = (val): val is unknown => true;

export const isNull: AssertFn<null> = (val): val is null => val === null;

export const isArray: AssertFn<unknown[]> = (val): val is unknown[] =>
    Array.isArray(val);

export const isFunction: AssertFn<() => unknown> = (
    val
): val is () => unknown => typeof val === 'function';

export function isTruthy<T>(val: T): val is Exclude<
    T,
    // all values are truthy except false, 0, -0, 0n, "", null, undefined, NaN, and document.all
    0 | -0 | 0n | '' | null | undefined
> {
    return !!val;
}

/**
 * Produces a check that the value is exactly the constant provided.
 */
export function isExact<const T>(constant: T): (val: unknown) => val is T {
    return isEnum(constant);
}

/**
 * Produces a check that the value is exactly the constant provided.
 */
export const is: typeof isExact = isExact;

/**
 * Produces a check that the value is one of exactly the constants provided.
 */
export function isEnum<const T>(...values: T[]): (val: unknown) => val is T {
    return (val: unknown): val is T => values.some((which) => which === val);
}

/**
 * Produces a check that satisfies one of the provided checks.
 */
export function isEither<X extends AssertFn<any>[]>(
    ...checks: X
): (val: unknown) => val is AssertFnType<X[number]> {
    return (val: unknown): val is AssertFnType<X[number]> => {
        return checks.some((check) => check(val));
    };
}

/**
 * Produces a check that the value is an array of items that satisfy the provided checks.
 */
export function isArrayOf<T>(check: AssertFn<T>): (val: unknown) => val is T[] {
    return (val: unknown): val is T[] => {
        return Array.isArray(val) && val.every((item) => check(item));
    };
}

/**
 * Produces a check that the value is an object whose keys all satisfy the provided check
 */
export function isRecordOf<T>(isThing: AssertFn<T>) {
    return (record: unknown): record is Record<string, T> =>
        !!(
            typeof record === 'object' &&
            record &&
            !Array.isArray(record) &&
            Object.values(record).every((value) => isThing(value))
        );
}

/**
 * Produces a check that the value is an object whose entries (keys and values) all satisfy the provided check
 */
export function isRecordWith<K extends string | number | symbol, V>(
    isEntry: AssertFn<[K, V]>
) {
    return (record: unknown): record is Record<K, V> =>
        !!(
            typeof record === 'object' &&
            record &&
            !Array.isArray(record) &&
            Object.entries(record).every((entry) => isEntry(entry))
        );
}

/**
 * Produces a check that the value is an object whose entries (keys and values) all satisfy the provided check
 */
export function isTuple<K, V>(isLeft: AssertFn<K>, isRight: AssertFn<V>) {
    return (pair: unknown): pair is [K, V] =>
        !!(
            typeof pair === 'object' &&
            pair &&
            Array.isArray(pair) &&
            pair.length === 2 &&
            isLeft(pair[0]) &&
            isRight(pair[1])
        );
}

/**
 * Produces a check that the value is an object containing keys that map to checks.
 */
export function isShape<T extends Record<string, AssertFn<any>>>(
    shape: T
): AssertFn<{ [Key in keyof T]: AssertFnType<T[Key]> }> {
    return (
        val: unknown
    ): val is { [Key in keyof T]: AssertFnType<T[Key]> } => {
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
