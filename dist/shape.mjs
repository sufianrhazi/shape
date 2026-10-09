// src/shape.ts
var version = "2.0.0";
function defineHidden(target, key, value) {
  Object.defineProperty(target, key, {
    value,
    enumerable: false,
    writable: false,
    configurable: false
  });
}
var shapeChecks = /* @__PURE__ */ new WeakMap();
var PASS = { ok: true };
function fail(path, error) {
  return { ok: false, path: [...path], error };
}
function render(value) {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}
function isOptional(fn) {
  return configOf(fn)?.optional === true;
}
function build(predicate, spec, checkFn, opts = {}) {
  const wrapped = (val) => predicate(val);
  defineHidden(wrapped, "spec", spec);
  if (opts.meta !== void 0) {
    defineHidden(wrapped, "meta", opts.meta);
  }
  if (opts.config !== void 0) {
    defineHidden(wrapped, "config", opts.config);
  }
  shapeChecks.set(wrapped, checkFn);
  return wrapped;
}
function checkOf(fn) {
  return typeof fn === "function" ? shapeChecks.get(fn) : void 0;
}
function fallbackCheck(fn, value, path) {
  return fn(value) ? PASS : fail(path, "failed custom check");
}
function childCheck(fn, value, path) {
  const checkFn = checkOf(fn);
  return checkFn ? checkFn(value, path) : fallbackCheck(fn, value, path);
}
function specOf(value) {
  if (typeof value === "function" && "spec" in value) {
    return value.spec;
  }
  return { kind: "opaque" };
}
function metaOf(value) {
  if (typeof value === "function" && "meta" in value) {
    return value.meta;
  }
  return void 0;
}
function configOf(value) {
  if (typeof value === "function" && "config" in value) {
    return value.config;
  }
  return void 0;
}
function check(shape, value) {
  const checkFn = checkOf(shape);
  return checkFn ? checkFn(value, []) : fallbackCheck(shape, value, []);
}
function withMeta(fn, meta) {
  const existing = metaOf(fn);
  const merged = existing === void 0 ? meta : { ...existing, ...meta };
  const config = configOf(fn);
  const checkFn = checkOf(fn) ?? ((v, p) => fallbackCheck(fn, v, p));
  return build(fn, specOf(fn), checkFn, {
    meta: merged,
    ...config === void 0 ? {} : { config }
  });
}
var isString = build(
  (val) => typeof val === "string",
  { kind: "string" },
  (val, path) => typeof val === "string" ? PASS : fail(path, "expected string")
);
var isNumber = build(
  (val) => typeof val === "number",
  { kind: "number" },
  (val, path) => typeof val === "number" ? PASS : fail(path, "expected number")
);
var isBigint = build(
  (val) => typeof val === "bigint",
  { kind: "bigint" },
  (val, path) => typeof val === "bigint" ? PASS : fail(path, "expected bigint")
);
var isBoolean = build(
  (val) => typeof val === "boolean",
  { kind: "boolean" },
  (val, path) => typeof val === "boolean" ? PASS : fail(path, "expected boolean")
);
var isSymbol = build(
  (val) => typeof val === "symbol",
  { kind: "symbol" },
  (val, path) => typeof val === "symbol" ? PASS : fail(path, "expected symbol")
);
var isUndefined = build(
  (val) => val === void 0,
  { kind: "undefined" },
  (val, path) => val === void 0 ? PASS : fail(path, "expected undefined")
);
var isUnknown = build(
  (val) => true,
  { kind: "unknown" },
  () => PASS
);
var isNull = build(
  (val) => val === null,
  { kind: "null" },
  (val, path) => val === null ? PASS : fail(path, "expected null")
);
var isArray = build(
  (val) => Array.isArray(val),
  { kind: "array" },
  (val, path) => Array.isArray(val) ? PASS : fail(path, "expected array")
);
var isFunction = build(
  (val) => typeof val === "function",
  { kind: "function" },
  (val, path) => typeof val === "function" ? PASS : fail(path, "expected function")
);
function isTruthy(val) {
  return !!val;
}
function isExact(constant) {
  return build(
    (val) => val === constant,
    { kind: "literal", value: constant },
    (val, path) => val === constant ? PASS : fail(path, `expected ${render(constant)}`)
  );
}
var is = isExact;
function isEnum(...values) {
  return build(
    (val) => values.some((which) => which === val),
    { kind: "enum", values },
    (val, path) => values.some((which) => which === val) ? PASS : fail(path, `expected one of ${values.map(render).join(", ")}`)
  );
}
function isEither(...checks) {
  return build(
    (val) => checks.some((check2) => check2(val)),
    { kind: "either", options: checks.map((check2) => specOf(check2)) },
    (val, path) => {
      for (const check2 of checks) {
        if (childCheck(check2, val, path).ok) {
          return PASS;
        }
      }
      return fail(path, "did not match any expected shape");
    }
  );
}
function isArrayOf(check2) {
  return build(
    (val) => {
      if (!Array.isArray(val)) {
        return false;
      }
      for (let i = 0; i < val.length; i += 1) {
        if (!(i in val) || !check2(val[i])) {
          return false;
        }
      }
      return true;
    },
    { kind: "arrayOf", item: specOf(check2) },
    (val, path) => {
      if (!Array.isArray(val)) {
        return fail(path, "expected array");
      }
      for (let i = 0; i < val.length; i += 1) {
        if (!(i in val)) {
          return fail([...path, String(i)], "unexpected empty slot");
        }
        const result = childCheck(check2, val[i], [...path, String(i)]);
        if (!result.ok) {
          return result;
        }
      }
      return PASS;
    }
  );
}
function isRecordOf(isThing) {
  return build(
    (record) => !!(typeof record === "object" && record && !Array.isArray(record) && Object.values(record).every((value) => isThing(value))),
    { kind: "recordOf", value: specOf(isThing) },
    (val, path) => {
      if (typeof val !== "object" || val === null || Array.isArray(val)) {
        return fail(path, "expected record");
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
function isRecordWith(isEntry) {
  return build(
    (record) => !!(typeof record === "object" && record && !Array.isArray(record) && Object.entries(record).every((entry) => isEntry(entry))),
    { kind: "recordWith", entry: specOf(isEntry) },
    (val, path) => {
      if (typeof val !== "object" || val === null || Array.isArray(val)) {
        return fail(path, "expected record");
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
function isTuple(...fns) {
  return build(
    (val) => !!(isArray(val) && val.length === fns.length && fns.every((fn, i) => fns[i](val[i]))),
    { kind: "tuple", items: fns.map((fn) => specOf(fn)) },
    (val, path) => {
      if (!Array.isArray(val)) {
        return fail(path, "expected array");
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
function fieldSpecs(shape) {
  const fields = {};
  for (const [key, child] of Object.entries(shape)) {
    const meta = metaOf(child);
    fields[key] = {
      spec: specOf(child),
      ...isOptional(child) ? { optional: true } : {},
      ...meta === void 0 ? {} : { meta }
    };
  }
  return fields;
}
function isShape(shape, options) {
  const strict = options?.strict === true;
  return build(
    (val) => {
      if (typeof val !== "object") {
        return false;
      }
      if (!val) {
        return false;
      }
      for (const [key, check2] of Object.entries(shape)) {
        if (!(key in val)) {
          if (isOptional(check2)) {
            continue;
          }
          return false;
        }
        if (!check2(val[key])) {
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
    { kind: "shape", fields: fieldSpecs(shape), strict },
    (val, path) => {
      if (typeof val !== "object" || val === null) {
        return fail(path, "expected object");
      }
      for (const [key, check2] of Object.entries(shape)) {
        if (!(key in val)) {
          if (isOptional(check2)) {
            continue;
          }
          return fail([...path, key], "missing required property");
        }
        const result = childCheck(
          check2,
          val[key],
          [...path, key]
        );
        if (!result.ok) {
          return result;
        }
      }
      if (strict) {
        for (const key of Object.keys(val)) {
          if (!(key in shape)) {
            return fail([...path, key], "unexpected property");
          }
        }
      }
      return PASS;
    }
  );
}
function assertNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`bounded(): ${name} must be a finite number`);
  }
  return value;
}
function assertLength(value, name) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`bounded(): ${name} must be a non-negative integer`);
  }
  return value;
}
function assertBigint(value, name) {
  if (typeof value !== "bigint") {
    throw new Error(`bounded(): ${name} must be a bigint`);
  }
  return value;
}
function applyBounds(spec, bounds) {
  const hasNumeric = bounds.min !== void 0 || bounds.max !== void 0;
  const hasLength = bounds.minLength !== void 0 || bounds.maxLength !== void 0;
  if (spec.kind === "number") {
    if (hasLength) {
      throw new Error(
        "bounded(): minLength/maxLength do not apply to a number shape"
      );
    }
    const min = bounds.min === void 0 ? spec.min : assertNumber(bounds.min, "min");
    const max = bounds.max === void 0 ? spec.max : assertNumber(bounds.max, "max");
    if (min !== void 0 && max !== void 0 && min > max) {
      throw new Error("bounded(): min must be <= max");
    }
    const minExclusive = bounds.minExclusive === void 0 ? spec.minExclusive : bounds.minExclusive;
    const maxExclusive = bounds.maxExclusive === void 0 ? spec.maxExclusive : bounds.maxExclusive;
    return {
      kind: "number",
      min,
      max,
      ...minExclusive === void 0 ? {} : { minExclusive },
      ...maxExclusive === void 0 ? {} : { maxExclusive }
    };
  }
  if (spec.kind === "bigint") {
    if (hasLength) {
      throw new Error(
        "bounded(): minLength/maxLength do not apply to a bigint shape"
      );
    }
    const min = bounds.min === void 0 ? spec.min : assertBigint(bounds.min, "min");
    const max = bounds.max === void 0 ? spec.max : assertBigint(bounds.max, "max");
    if (min !== void 0 && max !== void 0 && min > max) {
      throw new Error("bounded(): min must be <= max");
    }
    const minExclusive = bounds.minExclusive === void 0 ? spec.minExclusive : bounds.minExclusive;
    const maxExclusive = bounds.maxExclusive === void 0 ? spec.maxExclusive : bounds.maxExclusive;
    return {
      kind: "bigint",
      min,
      max,
      ...minExclusive === void 0 ? {} : { minExclusive },
      ...maxExclusive === void 0 ? {} : { maxExclusive }
    };
  }
  if (spec.kind === "string") {
    if (hasNumeric) {
      throw new Error(
        "bounded(): min/max do not apply to a string shape"
      );
    }
    const minLength = bounds.minLength === void 0 ? spec.minLength : assertLength(bounds.minLength, "minLength");
    const maxLength = bounds.maxLength === void 0 ? spec.maxLength : assertLength(bounds.maxLength, "maxLength");
    if (minLength !== void 0 && maxLength !== void 0 && minLength > maxLength) {
      throw new Error("bounded(): minLength must be <= maxLength");
    }
    return {
      kind: "string",
      ...minLength === void 0 ? {} : { minLength },
      ...maxLength === void 0 ? {} : { maxLength }
    };
  }
  if (spec.kind === "arrayOf" || spec.kind === "array") {
    if (hasNumeric) {
      throw new Error(
        "bounded(): min/max do not apply to an array shape"
      );
    }
    const minLength = bounds.minLength === void 0 ? spec.minLength : assertLength(bounds.minLength, "minLength");
    const maxLength = bounds.maxLength === void 0 ? spec.maxLength : assertLength(bounds.maxLength, "maxLength");
    if (minLength !== void 0 && maxLength !== void 0 && minLength > maxLength) {
      throw new Error("bounded(): minLength must be <= maxLength");
    }
    return {
      ...spec,
      ...minLength === void 0 ? {} : { minLength },
      ...maxLength === void 0 ? {} : { maxLength }
    };
  }
  if (hasNumeric || hasLength) {
    throw new Error(
      `bounded(): bounds are not supported for a ${spec.kind} shape`
    );
  }
  return spec;
}
function withinBounds(spec, value) {
  if (spec.kind === "number") {
    if (typeof value !== "number") {
      return false;
    }
    if (spec.min !== void 0 && !(spec.minExclusive ? value > spec.min : value >= spec.min)) {
      return false;
    }
    if (spec.max !== void 0 && !(spec.maxExclusive ? value < spec.max : value <= spec.max)) {
      return false;
    }
    return true;
  }
  if (spec.kind === "bigint") {
    if (typeof value !== "bigint") {
      return false;
    }
    if (spec.min !== void 0 && !(spec.minExclusive ? value > spec.min : value >= spec.min)) {
      return false;
    }
    if (spec.max !== void 0 && !(spec.maxExclusive ? value < spec.max : value <= spec.max)) {
      return false;
    }
    return true;
  }
  if (spec.kind === "string") {
    if (typeof value !== "string") {
      return false;
    }
    if (spec.minLength !== void 0 && value.length < spec.minLength) {
      return false;
    }
    if (spec.maxLength !== void 0 && value.length > spec.maxLength) {
      return false;
    }
    return true;
  }
  if (spec.kind === "arrayOf" || spec.kind === "array") {
    if (!Array.isArray(value)) {
      return false;
    }
    if (spec.minLength !== void 0 && value.length < spec.minLength) {
      return false;
    }
    if (spec.maxLength !== void 0 && value.length > spec.maxLength) {
      return false;
    }
    return true;
  }
  return true;
}
function checkBounds(spec, value, path) {
  if (withinBounds(spec, value)) {
    return PASS;
  }
  if (spec.kind === "number") {
    if (typeof value !== "number") {
      return fail(path, "expected number");
    }
    if (spec.min !== void 0 && (spec.minExclusive ? value <= spec.min : value < spec.min)) {
      return fail(
        path,
        `expected number ${spec.minExclusive ? ">" : ">="} ${spec.min}`
      );
    }
    return fail(
      path,
      `expected number ${spec.maxExclusive ? "<" : "<="} ${spec.max}`
    );
  }
  if (spec.kind === "bigint") {
    if (typeof value !== "bigint") {
      return fail(path, "expected bigint");
    }
    if (spec.min !== void 0 && (spec.minExclusive ? value <= spec.min : value < spec.min)) {
      return fail(
        path,
        `expected bigint ${spec.minExclusive ? ">" : ">="} ${spec.min}`
      );
    }
    return fail(
      path,
      `expected bigint ${spec.maxExclusive ? "<" : "<="} ${spec.max}`
    );
  }
  if (spec.kind === "arrayOf" || spec.kind === "array") {
    if (!Array.isArray(value)) {
      return fail(path, "expected array");
    }
    if (spec.minLength !== void 0 && value.length < spec.minLength) {
      return fail(
        path,
        `expected array with length >= ${spec.minLength}`
      );
    }
    return fail(path, `expected array with length <= ${spec.maxLength}`);
  }
  if (spec.kind === "string") {
    if (typeof value !== "string") {
      return fail(path, "expected string");
    }
    if (spec.minLength !== void 0 && value.length < spec.minLength) {
      return fail(
        path,
        `expected string with length >= ${spec.minLength}`
      );
    }
    return fail(path, `expected string with length <= ${spec.maxLength}`);
  }
  return PASS;
}
function bounded(fn, bounds) {
  const spec = applyBounds(specOf(fn), bounds);
  const existingBounds = configOf(fn)?.bounds;
  const config = {
    ...configOf(fn),
    bounds: existingBounds === void 0 ? bounds : { ...existingBounds, ...bounds }
  };
  const checkFn = (val, path) => {
    const result = childCheck(fn, val, path);
    return result.ok ? checkBounds(spec, val, path) : result;
  };
  return build(
    (val) => fn(val) && withinBounds(spec, val),
    spec,
    checkFn,
    { meta: metaOf(fn), config }
  );
}
function optional(fn) {
  const config = { ...configOf(fn), optional: true };
  const checkFn = (val, path) => val === void 0 ? PASS : childCheck(fn, val, path);
  return build(
    (val) => val === void 0 || fn(val),
    specOf(fn),
    checkFn,
    { meta: metaOf(fn), config }
  );
}
var GENERATED_STRING_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
function makeRng(seed) {
  if (seed === void 0) {
    return Math.random;
  }
  let state = seed >>> 0;
  return () => {
    state = state + 1831565813 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function generatesStrings(spec) {
  switch (spec.kind) {
    case "string":
      return true;
    case "literal":
      return typeof spec.value === "string";
    case "enum":
      return spec.values.length > 0 && spec.values.every((value) => typeof value === "string");
    case "either":
      return spec.options.length > 0 && spec.options.every((option) => generatesStrings(option));
    default:
      return false;
  }
}
function canGenerate(spec) {
  switch (spec.kind) {
    case "opaque":
      return false;
    case "enum":
      return spec.values.length > 0;
    case "either":
      return spec.options.some((option) => canGenerate(option));
    case "arrayOf":
      return canGenerate(spec.item);
    case "tuple":
      return spec.items.every((item) => canGenerate(item));
    case "recordOf":
      return canGenerate(spec.value);
    case "recordWith":
      return spec.entry.kind === "tuple" && spec.entry.items.length === 2 && generatesStrings(spec.entry.items[0]) && canGenerate(spec.entry);
    case "shape":
      return Object.values(spec.fields).every(
        (field) => field.optional === true || canGenerate(field.spec)
      );
    default:
      return true;
  }
}
function generateNumber(spec, rng) {
  if (spec.kind !== "number") {
    return Math.floor(rng() * 1e3);
  }
  const rawMin = spec.min ?? 0;
  const rawMax = spec.max ?? rawMin + 999;
  const min = spec.minExclusive ? Math.floor(rawMin) + 1 : Math.ceil(rawMin);
  const max = spec.maxExclusive ? Math.ceil(rawMax) - 1 : Math.floor(rawMax);
  if (min > max) {
    throw new Error(
      "Cannot generate an integer within the given number bounds"
    );
  }
  return min + Math.floor(rng() * (max - min + 1));
}
function generateBigint(spec, rng) {
  if (spec.kind !== "bigint") {
    return BigInt(Math.floor(rng() * 1e3));
  }
  const rawMin = spec.min ?? 0n;
  const rawMax = spec.max ?? rawMin + 999n;
  const min = spec.minExclusive ? rawMin + 1n : rawMin;
  const max = spec.maxExclusive ? rawMax - 1n : rawMax;
  if (min > max) {
    throw new Error(
      "Cannot generate a bigint within the given bigint bounds"
    );
  }
  const span = Number(max - min);
  return min + BigInt(Math.floor(rng() * (span + 1)));
}
function generateString(spec, rng) {
  const minLength = spec.kind === "string" ? spec.minLength ?? 1 : 1;
  const maxLength = spec.kind === "string" ? spec.maxLength ?? Math.max(minLength, 8) : 8;
  const length = minLength + Math.floor(rng() * (maxLength - minLength + 1));
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += GENERATED_STRING_CHARS[Math.floor(rng() * GENERATED_STRING_CHARS.length)];
  }
  return result;
}
function arrayLengthFromSpec(spec, rng, length) {
  const minLength = spec.minLength;
  const maxLength = spec.maxLength;
  if (minLength === void 0 && maxLength === void 0) {
    return length();
  }
  const lo = minLength ?? 0;
  const hi = maxLength ?? Math.max(lo, lo + 2);
  return lo + Math.floor(rng() * (hi - lo + 1));
}
function generateFromSpec(spec, rng, length) {
  switch (spec.kind) {
    case "string":
      return generateString(spec, rng);
    case "number":
      return generateNumber(spec, rng);
    case "bigint":
      return generateBigint(spec, rng);
    case "boolean":
      return rng() < 0.5;
    case "symbol":
      return Symbol("generated");
    case "undefined":
      return void 0;
    case "unknown":
      return void 0;
    case "null":
      return null;
    case "array":
      return Array.from(
        { length: arrayLengthFromSpec(spec, rng, length) },
        () => void 0
      );
    case "function":
      return () => void 0;
    case "literal":
      return spec.value;
    case "enum":
      if (spec.values.length === 0) {
        throw new Error("Cannot generate a value for an empty enum");
      }
      return spec.values[Math.floor(rng() * spec.values.length)];
    case "either": {
      const options = spec.options.filter(
        (option) => canGenerate(option)
      );
      if (options.length === 0) {
        throw new Error(
          "Cannot generate a value: no option can be generated"
        );
      }
      return generateFromSpec(
        options[Math.floor(rng() * options.length)],
        rng,
        length
      );
    }
    case "arrayOf": {
      const count = arrayLengthFromSpec(spec, rng, length);
      return Array.from(
        { length: count },
        () => generateFromSpec(spec.item, rng, length)
      );
    }
    case "tuple":
      return spec.items.map(
        (item) => generateFromSpec(item, rng, length)
      );
    case "recordOf": {
      const record = {};
      const count = length();
      for (let i = 0; i < count; i += 1) {
        record[`k${i}`] = generateFromSpec(spec.value, rng, length);
      }
      return record;
    }
    case "recordWith": {
      if (spec.entry.kind !== "tuple" || spec.entry.items.length !== 2 || !generatesStrings(spec.entry.items[0])) {
        throw new Error(
          "Cannot generate a recordWith whose keys are not strings"
        );
      }
      const record = {};
      const count = length();
      for (let i = 0; i < count; i += 1) {
        const entry = generateFromSpec(spec.entry, rng, length);
        if (Array.isArray(entry) && entry.length === 2) {
          record[String(entry[0])] = entry[1];
        }
      }
      return record;
    }
    case "shape": {
      const result = {};
      for (const [key, field] of Object.entries(spec.fields)) {
        if (field.optional === true && !canGenerate(field.spec)) {
          continue;
        }
        result[key] = generateFromSpec(field.spec, rng, length);
      }
      return result;
    }
    case "opaque":
      throw new Error(
        "Cannot generate a value for an opaque shape; attach a spec to it first"
      );
  }
}
function normalizeInput(input) {
  return typeof input === "function" ? specOf(input) : input;
}
function generate(input, options) {
  const rng = options?.rng ?? makeRng(options?.seed);
  const length = options?.length ?? (() => Math.floor(rng() * 3));
  return generateFromSpec(normalizeInput(input), rng, length);
}
export {
  bounded,
  check,
  configOf,
  generate,
  is,
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
  isTruthy,
  isTuple,
  isUndefined,
  isUnknown,
  metaOf,
  optional,
  specOf,
  version,
  withMeta
};
//# sourceMappingURL=shape.mjs.map
