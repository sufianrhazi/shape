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
export type Spec =
    | { kind: 'string'; minLength?: number; maxLength?: number }
    | {
          kind: 'number';
          min?: number;
          max?: number;
          minExclusive?: boolean;
          maxExclusive?: boolean;
      }
    | {
          kind: 'bigint';
          min?: bigint;
          max?: bigint;
          minExclusive?: boolean;
          maxExclusive?: boolean;
      }
    | { kind: 'boolean' }
    | { kind: 'symbol' }
    | { kind: 'undefined' }
    | { kind: 'unknown' }
    | { kind: 'null' }
    | { kind: 'array'; minLength?: number; maxLength?: number }
    | { kind: 'function' }
    | { kind: 'literal'; value: unknown }
    | { kind: 'enum'; values: readonly unknown[] }
    | { kind: 'either'; options: readonly Spec[] }
    | { kind: 'arrayOf'; item: Spec; minLength?: number; maxLength?: number }
    | { kind: 'tuple'; items: readonly Spec[] }
    | { kind: 'recordOf'; value: Spec }
    | { kind: 'recordWith'; entry: Spec }
    | {
          kind: 'shape';
          fields: Readonly<Record<string, FieldSpec>>;
          strict: boolean;
      }
    | { kind: 'opaque' };

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
export type CheckResult =
    | { ok: true }
    | { ok: false; path: string[]; error: string };

type CheckFn = (value: unknown, path: readonly string[]) => CheckResult;

// Note: `spec`, `meta`, and `config` are attached as non-enumerable, read-only
// properties so a shape stays a plain function to consumers (Object.keys,
// spreads, JSON.stringify) while still being reflectable.
function defineHidden(target: object, key: string, value: unknown): void {
    Object.defineProperty(target, key, {
        value,
        enumerable: false,
        writable: false,
        configurable: false,
    });
}

// Checks are kept out of the public type surface in a WeakMap keyed by the
// shape function itself.
const shapeChecks = new WeakMap<object, CheckFn>();

const PASS: CheckResult = { ok: true };

function fail(path: readonly string[], error: string): CheckResult {
    return { ok: false, path: [...path], error };
}

function render(value: unknown): string {
    return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

function isOptional(fn: unknown): boolean {
    return configOf(fn)?.optional === true;
}

function build<T, C extends ShapeConfig = ShapeConfig>(
    predicate: AssertFn<T>,
    spec: Spec,
    checkFn: CheckFn,
    opts: { meta?: ShapeMeta; config?: C } = {}
): Shape<T, C> {
    const wrapped = (val: unknown): val is T => predicate(val);
    defineHidden(wrapped, 'spec', spec);
    if (opts.meta !== undefined) {
        defineHidden(wrapped, 'meta', opts.meta);
    }
    if (opts.config !== undefined) {
        defineHidden(wrapped, 'config', opts.config);
    }
    shapeChecks.set(wrapped, checkFn);
    return wrapped as Shape<T, C>;
}

function checkOf(fn: unknown): CheckFn | undefined {
    return typeof fn === 'function' ? shapeChecks.get(fn) : undefined;
}

function fallbackCheck(
    fn: AssertFn<unknown>,
    value: unknown,
    path: readonly string[]
): CheckResult {
    return fn(value) ? PASS : fail(path, 'failed custom check');
}

function childCheck(
    fn: AssertFn<unknown>,
    value: unknown,
    path: readonly string[]
): CheckResult {
    const checkFn = checkOf(fn);
    return checkFn ? checkFn(value, path) : fallbackCheck(fn, value, path);
}

/**
 * Extract the reflectable `Spec` from a shape. A plain assertion function with
 * no attached spec reflects as `{ kind: "opaque" }`.
 */
export function specOf(value: unknown): Spec {
    if (typeof value === 'function' && 'spec' in value) {
        return (value as Shape<unknown>).spec;
    }
    return { kind: 'opaque' };
}

/**
 * Extract the metadata attached to a shape (via `withMeta`), if any.
 */
export function metaOf(value: unknown): ShapeMeta | undefined {
    if (typeof value === 'function' && 'meta' in value) {
        return (value as Shape<unknown>).meta;
    }
    return undefined;
}

/**
 * Extract the private config attached to a shape, if any.
 */
export function configOf(value: unknown): ShapeConfig | undefined {
    if (typeof value === 'function' && 'config' in value) {
        return (value as Shape<unknown>).config;
    }
    return undefined;
}

/**
 * Check a value against a shape, returning either success or the first failure
 * with a path to the offending value and a human-readable error.
 */
export function check<T>(shape: AssertFn<T>, value: unknown): CheckResult {
    const checkFn = checkOf(shape);
    return checkFn ? checkFn(value, []) : fallbackCheck(shape, value, []);
}

/**
 * Returns a shape identical to `fn`, with the given metadata attached. The
 * metadata never affects validation; it is carried through reflection.
 */
export function withMeta<T, C extends ShapeConfig>(
    fn: Shape<T, C>,
    meta: ShapeMeta
): Shape<T, C>;
export function withMeta<T>(fn: AssertFn<T>, meta: ShapeMeta): Shape<T>;
export function withMeta<T>(fn: AssertFn<T>, meta: ShapeMeta): Shape<T> {
    const existing = metaOf(fn);
    const merged = existing === undefined ? meta : { ...existing, ...meta };
    const config = configOf(fn);
    const checkFn = checkOf(fn) ?? ((v, p) => fallbackCheck(fn, v, p));
    return build(fn, specOf(fn), checkFn, {
        meta: merged,
        ...(config === undefined ? {} : { config }),
    });
}

export const isString: Shape<string> = build(
    (val): val is string => typeof val === 'string',
    { kind: 'string' },
    (val, path) =>
        typeof val === 'string' ? PASS : fail(path, 'expected string')
);

export const isNumber: Shape<number> = build(
    (val): val is number => typeof val === 'number',
    { kind: 'number' },
    (val, path) =>
        typeof val === 'number' ? PASS : fail(path, 'expected number')
);

export const isBigint: Shape<bigint> = build(
    (val): val is bigint => typeof val === 'bigint',
    { kind: 'bigint' },
    (val, path) =>
        typeof val === 'bigint' ? PASS : fail(path, 'expected bigint')
);

export const isBoolean: Shape<boolean> = build(
    (val): val is boolean => typeof val === 'boolean',
    { kind: 'boolean' },
    (val, path) =>
        typeof val === 'boolean' ? PASS : fail(path, 'expected boolean')
);

export const isSymbol: Shape<symbol> = build(
    (val): val is symbol => typeof val === 'symbol',
    { kind: 'symbol' },
    (val, path) =>
        typeof val === 'symbol' ? PASS : fail(path, 'expected symbol')
);

export const isUndefined: Shape<undefined> = build(
    (val): val is undefined => val === undefined,
    { kind: 'undefined' },
    (val, path) => (val === undefined ? PASS : fail(path, 'expected undefined'))
);

export const isUnknown: Shape<unknown> = build(
    (val): val is unknown => true,
    { kind: 'unknown' },
    () => PASS
);

export const isNull: Shape<null> = build(
    (val): val is null => val === null,
    { kind: 'null' },
    (val, path) => (val === null ? PASS : fail(path, 'expected null'))
);

export const isArray: Shape<unknown[]> = build(
    (val): val is unknown[] => Array.isArray(val),
    { kind: 'array' },
    (val, path) => (Array.isArray(val) ? PASS : fail(path, 'expected array'))
);

export const isFunction: Shape<() => unknown> = build(
    (val): val is () => unknown => typeof val === 'function',
    { kind: 'function' },
    (val, path) =>
        typeof val === 'function' ? PASS : fail(path, 'expected function')
);

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
export function isExact<const T>(constant: T): Shape<T> {
    return build(
        (val: unknown): val is T => val === constant,
        { kind: 'literal', value: constant },
        (val, path) =>
            val === constant ? PASS : fail(path, `expected ${render(constant)}`)
    );
}

/**
 * Produces a check that the value is exactly the constant provided.
 */
export const is: typeof isExact = isExact;

/**
 * Produces a check that the value is one of exactly the constants provided.
 */
export function isEnum<const T>(...values: T[]): Shape<T> {
    return build(
        (val: unknown): val is T => values.some((which) => which === val),
        { kind: 'enum', values },
        (val, path) =>
            values.some((which) => which === val)
                ? PASS
                : fail(path, `expected one of ${values.map(render).join(', ')}`)
    );
}

/**
 * Produces a check that satisfies one of the provided checks.
 */
export function isEither<X extends AssertFn<any>[]>(
    ...checks: X
): Shape<AssertFnType<X[number]>> {
    return build(
        (val: unknown): val is AssertFnType<X[number]> =>
            checks.some((check) => check(val)),
        { kind: 'either', options: checks.map((check) => specOf(check)) },
        (val, path) => {
            for (const check of checks) {
                if (childCheck(check, val, path).ok) {
                    return PASS;
                }
            }
            return fail(path, 'did not match any expected shape');
        }
    );
}

/**
 * Produces a check that the value is an array of items that satisfy the provided checks.
 */
export function isArrayOf<T>(check: AssertFn<T>): Shape<T[]> {
    return build(
        (val: unknown): val is T[] => {
            if (!Array.isArray(val)) {
                return false;
            }
            for (let i = 0; i < val.length; i += 1) {
                if (!(i in val) || !check(val[i])) {
                    return false;
                }
            }
            return true;
        },
        { kind: 'arrayOf', item: specOf(check) },
        (val, path) => {
            if (!Array.isArray(val)) {
                return fail(path, 'expected array');
            }
            for (let i = 0; i < val.length; i += 1) {
                if (!(i in val)) {
                    return fail([...path, String(i)], 'unexpected empty slot');
                }
                const result = childCheck(check, val[i], [...path, String(i)]);
                if (!result.ok) {
                    return result;
                }
            }
            return PASS;
        }
    );
}

/**
 * Produces a check that the value is an object whose keys all satisfy the provided check
 */
export function isRecordOf<T>(isThing: AssertFn<T>): Shape<Record<string, T>> {
    return build(
        (record: unknown): record is Record<string, T> =>
            !!(
                typeof record === 'object' &&
                record &&
                !Array.isArray(record) &&
                Object.values(record).every((value) => isThing(value))
            ),
        { kind: 'recordOf', value: specOf(isThing) },
        (val, path) => {
            if (typeof val !== 'object' || val === null || Array.isArray(val)) {
                return fail(path, 'expected record');
            }
            for (const [key, value] of Object.entries(val)) {
                const result = childCheck(isThing, value, [...path, key]);
                if (!result.ok) {
                    return result;
                }
            }
            return PASS;
        }
    );
}

/**
 * Produces a check that the value is an object whose entries (keys and values) all satisfy the provided check
 */
export function isRecordWith<K extends string | number | symbol, V>(
    isEntry: AssertFn<[K, V]>
): Shape<Record<K, V>> {
    return build(
        (record: unknown): record is Record<K, V> =>
            !!(
                typeof record === 'object' &&
                record &&
                !Array.isArray(record) &&
                Object.entries(record).every((entry) => isEntry(entry))
            ),
        { kind: 'recordWith', entry: specOf(isEntry) },
        (val, path) => {
            if (typeof val !== 'object' || val === null || Array.isArray(val)) {
                return fail(path, 'expected record');
            }
            for (const entry of Object.entries(val)) {
                const result = childCheck(isEntry, entry, [...path, entry[0]]);
                if (!result.ok) {
                    return result;
                }
            }
            return PASS;
        }
    );
}

/**
 * Produces a check that the value is an arrays whose items all satisfy the provided check
 */
export function isTuple<T extends AssertFn<any>[]>(
    ...fns: T
): Shape<{ [P in keyof T]: AssertFnType<T[P]> }> {
    return build(
        (val: unknown): val is { [P in keyof T]: AssertFnType<T[P]> } =>
            !!(
                isArray(val) &&
                val.length === fns.length &&
                fns.every((fn, i) => fns[i](val[i]))
            ),
        { kind: 'tuple', items: fns.map((fn) => specOf(fn)) },
        (val, path) => {
            if (!Array.isArray(val)) {
                return fail(path, 'expected array');
            }
            if (val.length !== fns.length) {
                return fail(path, `expected array of length ${fns.length}`);
            }
            for (let i = 0; i < fns.length; i += 1) {
                const result = childCheck(fns[i], val[i], [...path, String(i)]);
                if (!result.ok) {
                    return result;
                }
            }
            return PASS;
        }
    );
}

type OptionalKeys<T extends Record<string, AssertFn<any>>> = {
    [Key in keyof T]: T[Key] extends { config?: { optional: true } }
        ? Key
        : never;
}[keyof T];

// Note: The wacky extends infer Obj ? { [Key in keyof Obj]: Obj[Key] } : never
// allows for "simplifying" the type when presented to users.
// Without this, users see ShapeType<...> which is not helpful
type ShapeType<T extends Record<string, AssertFn<any>>> = {
    [Key in keyof T as Exclude<Key, OptionalKeys<T>>]: AssertFnType<T[Key]>;
} & {
    [Key in OptionalKeys<T>]?: AssertFnType<T[Key]>;
} extends infer Obj
    ? { [Key in keyof Obj]: Obj[Key] }
    : never;

function fieldSpecs(
    shape: Record<string, AssertFn<any>>
): Record<string, FieldSpec> {
    const fields: Record<string, FieldSpec> = {};
    for (const [key, child] of Object.entries(shape)) {
        const meta = metaOf(child);
        fields[key] = {
            spec: specOf(child),
            ...(isOptional(child) ? { optional: true as const } : {}),
            ...(meta === undefined ? {} : { meta }),
        };
    }
    return fields;
}

/**
 * Produces a check that the value is an object containing keys that map to checks.
 *
 * When `options.strict` is true, the object must not contain any keys other
 * than the declared ones.
 */
export function isShape<T extends Record<string, AssertFn<any>>>(
    shape: T,
    options?: { strict?: boolean }
): Shape<ShapeType<T>> {
    const strict = options?.strict === true;
    return build(
        (val: unknown): val is ShapeType<T> => {
            if (typeof val !== 'object') {
                return false;
            }
            if (!val) {
                return false;
            }
            for (const [key, check] of Object.entries(shape)) {
                if (!(key in val)) {
                    if (isOptional(check)) {
                        continue;
                    }
                    return false;
                }
                if (!check((val as Record<string, any>)[key])) {
                    return false;
                }
            }
            if (strict) {
                for (const key of Object.keys(val)) {
                    if (!(key in shape)) {
                        return false;
                    }
                }
            }
            return true;
        },
        { kind: 'shape', fields: fieldSpecs(shape), strict },
        (val, path) => {
            if (typeof val !== 'object' || val === null) {
                return fail(path, 'expected object');
            }
            for (const [key, check] of Object.entries(shape)) {
                if (!(key in val)) {
                    if (isOptional(check)) {
                        continue;
                    }
                    return fail([...path, key], 'missing required property');
                }
                const result = childCheck(
                    check,
                    (val as Record<string, unknown>)[key],
                    [...path, key]
                );
                if (!result.ok) {
                    return result;
                }
            }
            if (strict) {
                for (const key of Object.keys(val)) {
                    if (!(key in shape)) {
                        return fail([...path, key], 'unexpected property');
                    }
                }
            }
            return PASS;
        }
    );
}

function assertNumber(value: unknown, name: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`bounded(): ${name} must be a finite number`);
    }
    return value;
}

function assertLength(value: unknown, name: string): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        throw new Error(`bounded(): ${name} must be a non-negative integer`);
    }
    return value;
}

function assertBigint(value: unknown, name: string): bigint {
    if (typeof value !== 'bigint') {
        throw new Error(`bounded(): ${name} must be a bigint`);
    }
    return value;
}

function applyBounds(spec: Spec, bounds: Bounds): Spec {
    const hasNumeric = bounds.min !== undefined || bounds.max !== undefined;
    const hasLength =
        bounds.minLength !== undefined || bounds.maxLength !== undefined;
    if (spec.kind === 'number') {
        if (hasLength) {
            throw new Error(
                'bounded(): minLength/maxLength do not apply to a number shape'
            );
        }
        const min =
            bounds.min === undefined
                ? spec.min
                : assertNumber(bounds.min, 'min');
        const max =
            bounds.max === undefined
                ? spec.max
                : assertNumber(bounds.max, 'max');
        if (min !== undefined && max !== undefined && min > max) {
            throw new Error('bounded(): min must be <= max');
        }
        const minExclusive =
            bounds.minExclusive === undefined
                ? spec.minExclusive
                : bounds.minExclusive;
        const maxExclusive =
            bounds.maxExclusive === undefined
                ? spec.maxExclusive
                : bounds.maxExclusive;
        return {
            kind: 'number',
            min,
            max,
            ...(minExclusive === undefined ? {} : { minExclusive }),
            ...(maxExclusive === undefined ? {} : { maxExclusive }),
        };
    }
    if (spec.kind === 'bigint') {
        if (hasLength) {
            throw new Error(
                'bounded(): minLength/maxLength do not apply to a bigint shape'
            );
        }
        const min =
            bounds.min === undefined
                ? spec.min
                : assertBigint(bounds.min, 'min');
        const max =
            bounds.max === undefined
                ? spec.max
                : assertBigint(bounds.max, 'max');
        if (min !== undefined && max !== undefined && min > max) {
            throw new Error('bounded(): min must be <= max');
        }
        const minExclusive =
            bounds.minExclusive === undefined
                ? spec.minExclusive
                : bounds.minExclusive;
        const maxExclusive =
            bounds.maxExclusive === undefined
                ? spec.maxExclusive
                : bounds.maxExclusive;
        return {
            kind: 'bigint',
            min,
            max,
            ...(minExclusive === undefined ? {} : { minExclusive }),
            ...(maxExclusive === undefined ? {} : { maxExclusive }),
        };
    }
    if (spec.kind === 'string') {
        if (hasNumeric) {
            throw new Error(
                'bounded(): min/max do not apply to a string shape'
            );
        }
        const minLength =
            bounds.minLength === undefined
                ? spec.minLength
                : assertLength(bounds.minLength, 'minLength');
        const maxLength =
            bounds.maxLength === undefined
                ? spec.maxLength
                : assertLength(bounds.maxLength, 'maxLength');
        if (
            minLength !== undefined &&
            maxLength !== undefined &&
            minLength > maxLength
        ) {
            throw new Error('bounded(): minLength must be <= maxLength');
        }
        return {
            kind: 'string',
            ...(minLength === undefined ? {} : { minLength }),
            ...(maxLength === undefined ? {} : { maxLength }),
        };
    }
    if (spec.kind === 'arrayOf' || spec.kind === 'array') {
        if (hasNumeric) {
            throw new Error(
                'bounded(): min/max do not apply to an array shape'
            );
        }
        const minLength =
            bounds.minLength === undefined
                ? spec.minLength
                : assertLength(bounds.minLength, 'minLength');
        const maxLength =
            bounds.maxLength === undefined
                ? spec.maxLength
                : assertLength(bounds.maxLength, 'maxLength');
        if (
            minLength !== undefined &&
            maxLength !== undefined &&
            minLength > maxLength
        ) {
            throw new Error('bounded(): minLength must be <= maxLength');
        }
        return {
            ...spec,
            ...(minLength === undefined ? {} : { minLength }),
            ...(maxLength === undefined ? {} : { maxLength }),
        };
    }
    if (hasNumeric || hasLength) {
        throw new Error(
            `bounded(): bounds are not supported for a ${spec.kind} shape`
        );
    }
    return spec;
}

function withinBounds(spec: Spec, value: unknown): boolean {
    if (spec.kind === 'number') {
        if (typeof value !== 'number') {
            return false;
        }
        if (
            spec.min !== undefined &&
            !(spec.minExclusive ? value > spec.min : value >= spec.min)
        ) {
            return false;
        }
        if (
            spec.max !== undefined &&
            !(spec.maxExclusive ? value < spec.max : value <= spec.max)
        ) {
            return false;
        }
        return true;
    }
    if (spec.kind === 'bigint') {
        if (typeof value !== 'bigint') {
            return false;
        }
        if (
            spec.min !== undefined &&
            !(spec.minExclusive ? value > spec.min : value >= spec.min)
        ) {
            return false;
        }
        if (
            spec.max !== undefined &&
            !(spec.maxExclusive ? value < spec.max : value <= spec.max)
        ) {
            return false;
        }
        return true;
    }
    if (spec.kind === 'string') {
        if (typeof value !== 'string') {
            return false;
        }
        if (spec.minLength !== undefined && value.length < spec.minLength) {
            return false;
        }
        if (spec.maxLength !== undefined && value.length > spec.maxLength) {
            return false;
        }
        return true;
    }
    if (spec.kind === 'arrayOf' || spec.kind === 'array') {
        if (!Array.isArray(value)) {
            return false;
        }
        if (spec.minLength !== undefined && value.length < spec.minLength) {
            return false;
        }
        if (spec.maxLength !== undefined && value.length > spec.maxLength) {
            return false;
        }
        return true;
    }
    return true;
}

function checkBounds(
    spec: Spec,
    value: unknown,
    path: readonly string[]
): CheckResult {
    if (withinBounds(spec, value)) {
        return PASS;
    }
    if (spec.kind === 'number') {
        if (typeof value !== 'number') {
            return fail(path, 'expected number');
        }
        if (
            spec.min !== undefined &&
            (spec.minExclusive ? value <= spec.min : value < spec.min)
        ) {
            return fail(
                path,
                `expected number ${spec.minExclusive ? '>' : '>='} ${spec.min}`
            );
        }
        return fail(
            path,
            `expected number ${spec.maxExclusive ? '<' : '<='} ${spec.max}`
        );
    }
    if (spec.kind === 'bigint') {
        if (typeof value !== 'bigint') {
            return fail(path, 'expected bigint');
        }
        if (
            spec.min !== undefined &&
            (spec.minExclusive ? value <= spec.min : value < spec.min)
        ) {
            return fail(
                path,
                `expected bigint ${spec.minExclusive ? '>' : '>='} ${spec.min}`
            );
        }
        return fail(
            path,
            `expected bigint ${spec.maxExclusive ? '<' : '<='} ${spec.max}`
        );
    }
    if (spec.kind === 'arrayOf' || spec.kind === 'array') {
        if (!Array.isArray(value)) {
            return fail(path, 'expected array');
        }
        if (spec.minLength !== undefined && value.length < spec.minLength) {
            return fail(
                path,
                `expected array with length >= ${spec.minLength}`
            );
        }
        return fail(path, `expected array with length <= ${spec.maxLength}`);
    }
    if (spec.kind === 'string') {
        if (typeof value !== 'string') {
            return fail(path, 'expected string');
        }
        if (spec.minLength !== undefined && value.length < spec.minLength) {
            return fail(
                path,
                `expected string with length >= ${spec.minLength}`
            );
        }
        return fail(path, `expected string with length <= ${spec.maxLength}`);
    }
    return PASS;
}

/**
 * Returns a shape identical to `fn`, but with the given bounds. Bounds are
 * enforced by the returned shape and respected by `generate()`.
 */
export function bounded<T, C extends ShapeConfig>(
    fn: Shape<T, C>,
    bounds: Bounds
): Shape<T, C>;
export function bounded<T>(
    fn: AssertFn<T>,
    bounds: Bounds
): Shape<T, ShapeConfig>;
export function bounded<T>(
    fn: AssertFn<T>,
    bounds: Bounds
): Shape<T, ShapeConfig> {
    const spec = applyBounds(specOf(fn), bounds);
    const existingBounds = configOf(fn)?.bounds;
    const config: ShapeConfig = {
        ...configOf(fn),
        bounds:
            existingBounds === undefined
                ? bounds
                : { ...existingBounds, ...bounds },
    };
    const checkFn: CheckFn = (val, path) => {
        const result = childCheck(fn, val, path);
        return result.ok ? checkBounds(spec, val, path) : result;
    };
    return build(
        (val): val is T => fn(val) && withinBounds(spec, val),
        spec,
        checkFn,
        { meta: metaOf(fn), config }
    );
}

/**
 * Returns a shape identical to `fn`, marked as an optional (possibly
 * `undefined`) field of an object shape.
 */
export function optional<T, C extends ShapeConfig>(
    fn: Shape<T, C>
): Shape<T | undefined, C & { optional: true }>;
export function optional<T>(
    fn: AssertFn<T>
): Shape<T | undefined, { optional: true }>;
export function optional<T>(
    fn: AssertFn<T>
): Shape<T | undefined, ShapeConfig> {
    const config: ShapeConfig = { ...configOf(fn), optional: true };
    const checkFn: CheckFn = (val, path) =>
        val === undefined ? PASS : childCheck(fn, val, path);
    return build(
        (val): val is T | undefined => val === undefined || fn(val),
        specOf(fn),
        checkFn,
        { meta: metaOf(fn), config }
    );
}

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

const GENERATED_STRING_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function makeRng(seed: number | undefined): () => number {
    if (seed === undefined) {
        return Math.random;
    }
    let state = seed >>> 0;
    return (): number => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Whether a spec can only ever produce string values (used to keep generated
 * record keys strings, since object keys are strings).
 */
function generatesStrings(spec: Spec): boolean {
    switch (spec.kind) {
        case 'string':
            return true;
        case 'literal':
            return typeof spec.value === 'string';
        case 'enum':
            return (
                spec.values.length > 0 &&
                spec.values.every((value) => typeof value === 'string')
            );
        case 'either':
            return (
                spec.options.length > 0 &&
                spec.options.every((option) => generatesStrings(option))
            );
        default:
            return false;
    }
}

/**
 * Whether a spec can be materialized by `generate()`. `opaque` (and anything
 * that recursively contains it as a requirement) cannot.
 */
function canGenerate(spec: Spec): boolean {
    switch (spec.kind) {
        case 'opaque':
            return false;
        case 'enum':
            return spec.values.length > 0;
        case 'either':
            return spec.options.some((option) => canGenerate(option));
        case 'arrayOf':
            return canGenerate(spec.item);
        case 'tuple':
            return spec.items.every((item) => canGenerate(item));
        case 'recordOf':
            return canGenerate(spec.value);
        case 'recordWith':
            return (
                spec.entry.kind === 'tuple' &&
                spec.entry.items.length === 2 &&
                generatesStrings(spec.entry.items[0]) &&
                canGenerate(spec.entry)
            );
        case 'shape':
            return Object.values(spec.fields).every(
                (field) => field.optional === true || canGenerate(field.spec)
            );
        default:
            return true;
    }
}

function generateNumber(spec: Spec, rng: () => number): number {
    if (spec.kind !== 'number') {
        return Math.floor(rng() * 1000);
    }
    const rawMin = spec.min ?? 0;
    const rawMax = spec.max ?? rawMin + 999;
    const min = spec.minExclusive ? Math.floor(rawMin) + 1 : Math.ceil(rawMin);
    const max = spec.maxExclusive ? Math.ceil(rawMax) - 1 : Math.floor(rawMax);
    if (min > max) {
        throw new Error(
            'Cannot generate an integer within the given number bounds'
        );
    }
    return min + Math.floor(rng() * (max - min + 1));
}

function generateBigint(spec: Spec, rng: () => number): bigint {
    if (spec.kind !== 'bigint') {
        return BigInt(Math.floor(rng() * 1000));
    }
    const rawMin = spec.min ?? 0n;
    const rawMax = spec.max ?? rawMin + 999n;
    const min = spec.minExclusive ? rawMin + 1n : rawMin;
    const max = spec.maxExclusive ? rawMax - 1n : rawMax;
    if (min > max) {
        throw new Error(
            'Cannot generate a bigint within the given bigint bounds'
        );
    }
    const span = Number(max - min);
    return min + BigInt(Math.floor(rng() * (span + 1)));
}

function generateString(spec: Spec, rng: () => number): string {
    const minLength = spec.kind === 'string' ? (spec.minLength ?? 1) : 1;
    const maxLength =
        spec.kind === 'string' ? (spec.maxLength ?? Math.max(minLength, 8)) : 8;
    const length = minLength + Math.floor(rng() * (maxLength - minLength + 1));
    let result = '';
    for (let i = 0; i < length; i += 1) {
        result +=
            GENERATED_STRING_CHARS[
                Math.floor(rng() * GENERATED_STRING_CHARS.length)
            ];
    }
    return result;
}

function arrayLengthFromSpec(
    spec: { minLength?: number; maxLength?: number },
    rng: () => number,
    length: () => number
): number {
    const minLength = spec.minLength;
    const maxLength = spec.maxLength;
    if (minLength === undefined && maxLength === undefined) {
        return length();
    }
    const lo = minLength ?? 0;
    const hi = maxLength ?? Math.max(lo, lo + 2);
    return lo + Math.floor(rng() * (hi - lo + 1));
}

function generateFromSpec(
    spec: Spec,
    rng: () => number,
    length: () => number
): unknown {
    switch (spec.kind) {
        case 'string':
            return generateString(spec, rng);
        case 'number':
            return generateNumber(spec, rng);
        case 'bigint':
            return generateBigint(spec, rng);
        case 'boolean':
            return rng() < 0.5;
        case 'symbol':
            return Symbol('generated');
        case 'undefined':
            return undefined;
        case 'unknown':
            return undefined;
        case 'null':
            return null;
        case 'array':
            return Array.from(
                { length: arrayLengthFromSpec(spec, rng, length) },
                () => undefined
            );
        case 'function':
            return (): undefined => undefined;
        case 'literal':
            return spec.value;
        case 'enum':
            if (spec.values.length === 0) {
                throw new Error('Cannot generate a value for an empty enum');
            }
            return spec.values[Math.floor(rng() * spec.values.length)];
        case 'either': {
            const options = spec.options.filter((option) =>
                canGenerate(option)
            );
            if (options.length === 0) {
                throw new Error(
                    'Cannot generate a value: no option can be generated'
                );
            }
            return generateFromSpec(
                options[Math.floor(rng() * options.length)],
                rng,
                length
            );
        }
        case 'arrayOf': {
            const count = arrayLengthFromSpec(spec, rng, length);
            return Array.from({ length: count }, () =>
                generateFromSpec(spec.item, rng, length)
            );
        }
        case 'tuple':
            return spec.items.map((item) =>
                generateFromSpec(item, rng, length)
            );
        case 'recordOf': {
            const record: Record<string, unknown> = {};
            const count = length();
            for (let i = 0; i < count; i += 1) {
                record[`k${i}`] = generateFromSpec(spec.value, rng, length);
            }
            return record;
        }
        case 'recordWith': {
            if (
                spec.entry.kind !== 'tuple' ||
                spec.entry.items.length !== 2 ||
                !generatesStrings(spec.entry.items[0])
            ) {
                throw new Error(
                    'Cannot generate a recordWith whose keys are not strings'
                );
            }
            const record: Record<string, unknown> = {};
            const count = length();
            for (let i = 0; i < count; i += 1) {
                const entry = generateFromSpec(spec.entry, rng, length);
                if (Array.isArray(entry) && entry.length === 2) {
                    record[String(entry[0])] = entry[1];
                }
            }
            return record;
        }
        case 'shape': {
            const result: Record<string, unknown> = {};
            for (const [key, field] of Object.entries(spec.fields)) {
                if (field.optional === true && !canGenerate(field.spec)) {
                    continue;
                }
                result[key] = generateFromSpec(field.spec, rng, length);
            }
            return result;
        }
        case 'opaque':
            throw new Error(
                'Cannot generate a value for an opaque shape; attach a spec to it first'
            );
    }
}

function normalizeInput(input: AssertFn<any> | Spec): Spec {
    return typeof input === 'function' ? specOf(input) : input;
}

/**
 * Produce a random value that satisfies the given shape.
 *
 * Generation walks the shape's reflected `Spec`, respecting any bounds
 * attached via `bounded()`. Arbitrary (opaque) assertion functions cannot be
 * generated and throw.
 */
export function generate<T>(shape: AssertFn<T>, options?: GenerateOptions): T;
export function generate(spec: Spec, options?: GenerateOptions): unknown;
export function generate(
    input: AssertFn<any> | Spec,
    options?: GenerateOptions
): unknown {
    const rng = options?.rng ?? makeRng(options?.seed);
    const length = options?.length ?? ((): number => Math.floor(rng() * 3));
    return generateFromSpec(normalizeInput(input), rng, length);
}
