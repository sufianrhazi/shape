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
  isShape: () => isShape,
  isString: () => isString,
  isSymbol: () => isSymbol,
  isUndefined: () => isUndefined,
  version: () => version
});
module.exports = __toCommonJS(shape_exports);
var version = "1.0.0";
var isString = (val) => typeof val === "string";
var isNumber = (val) => typeof val === "number";
var isBigint = (val) => typeof val === "bigint";
var isBoolean = (val) => typeof val === "boolean";
var isSymbol = (val) => typeof val === "symbol";
var isUndefined = (val) => val === void 0;
var isNull = (val) => val === null;
var isArray = (val) => Array.isArray(val);
var isFunction = (val) => typeof val === "function";
function isExact(constant) {
  return isEnum(constant);
}
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
