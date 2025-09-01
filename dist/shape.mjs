// src/shape.ts
var version = "1.4.0";
var isString = (val) => typeof val === "string";
var isNumber = (val) => typeof val === "number";
var isBigint = (val) => typeof val === "bigint";
var isBoolean = (val) => typeof val === "boolean";
var isSymbol = (val) => typeof val === "symbol";
var isUndefined = (val) => val === void 0;
var optional = (fn) => {
  return Object.assign(
    (val) => val === void 0 || fn(val),
    { __optional: true }
  );
};
var isUnknown = (val) => true;
var isNull = (val) => val === null;
var isArray = (val) => Array.isArray(val);
var isFunction = (val) => typeof val === "function";
function isTruthy(val) {
  return !!val;
}
function isExact(constant) {
  return isEnum(constant);
}
var is = isExact;
function isEnum(...values) {
  return (val) => values.some((which) => which === val);
}
function isEither(...checks) {
  return (val) => {
    return checks.some((check) => check(val));
  };
}
function isArrayOf(check) {
  return (val) => {
    return Array.isArray(val) && val.every((item) => check(item));
  };
}
function isRecordOf(isThing) {
  return (record) => !!(typeof record === "object" && record && !Array.isArray(record) && Object.values(record).every((value) => isThing(value)));
}
function isRecordWith(isEntry) {
  return (record) => !!(typeof record === "object" && record && !Array.isArray(record) && Object.entries(record).every((entry) => isEntry(entry)));
}
function isTuple(...fns) {
  return (val) => {
    return !!(isArray(val) && val.length === fns.length && fns.every((fn, i) => fns[i](val[i])));
  };
}
function isShape(shape) {
  return (val) => {
    if (typeof val !== "object") {
      return false;
    }
    if (!val) {
      return false;
    }
    for (const [key, check] of Object.entries(shape)) {
      if (!(key in val)) {
        if (check.__optional) {
          continue;
        }
        return false;
      }
      if (!check(val[key])) {
        return false;
      }
    }
    return true;
  };
}
export {
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
  optional,
  version
};
//# sourceMappingURL=shape.mjs.map
