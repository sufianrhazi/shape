"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/shape.ts
var shape_exports = {};
__export(shape_exports, {
  is: () => is,
  isArray: () => isArray,
  isArrayOf: () => isArrayOf,
  isBigint: () => isBigint,
  isBoolean: () => isBoolean,
  isEither: () => isEither,
  isEnum: () => isEnum,
  isExact: () => isExact,
  isFunction: () => isFunction,
  isNull: () => isNull,
  isNumber: () => isNumber,
  isRecordOf: () => isRecordOf,
  isRecordWith: () => isRecordWith,
  isShape: () => isShape,
  isString: () => isString,
  isSymbol: () => isSymbol,
  isTruthy: () => isTruthy,
  isTuple: () => isTuple,
  isUndefined: () => isUndefined,
  isUnknown: () => isUnknown,
  optional: () => optional,
  version: () => version
});
module.exports = __toCommonJS(shape_exports);
var version = "1.3.0";
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
function isTuple(isLeft, isRight) {
  return (pair) => !!(typeof pair === "object" && pair && Array.isArray(pair) && pair.length === 2 && isLeft(pair[0]) && isRight(pair[1]));
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
//# sourceMappingURL=shape.cjs.map
