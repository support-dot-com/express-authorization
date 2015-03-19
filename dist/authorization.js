(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.authorization = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  considerSubject: considerSubject,
  considerPermissions: considerPermissions
}

function considerSubject(subject) {
  var permissions = [];
  if (subject && subject.permissions) permissions = subject.permissions;
  return considerPermissions(permissions);
}

function considerPermissions(/* permission ... or [permission, ....] */) {
  var claim = compileClaim.apply(null, arguments);
  Object.defineProperty(claim, "isPermitted", { value: isPermitted });
  return claim;
}

function coalescePermissions(/* permission ... or [permission, ...] */) {
  var permissions = [], i;
  for (i=0; i < arguments.length; i++) {
    if (arguments[i] != null && arguments[i] != undefined){
      permissions = permissions.concat(arguments[i]);
    }
  }
  return permissions;
}

function isPermitted(/* permission ... or [permission, ...] */) {
  var permissions = coalescePermissions.apply(null, arguments);
  if (permissions.length == 0) return false;
  for (var i=0; i<permissions.length; i++) {
    if (!this.test(permissions[i])) return false;
  }
  return true;
}

function compileClaim(/* permission ... or [permission, ....] */) {
  var permissions = coalescePermissions.apply(null, arguments);
  if (permissions.length == 0) return new RegExp("$false^");

  function compilePermission(permission) {
    permission = permission.replace(/(\:\*)+$/, "");
    return permission.split(":").map(function (part) {
      var list = part.split(",").map(function (part) {
        return compilePart(part);
      });
      switch (list.length) {
        case 0: return "";
        case 1: return list[0];
        default: return "(" + list.join("|") + ")";
      }
    }).join(":");
  }

  function compilePart(part) {
    var special = "\\^$*+?.()|{}[]";
    var exp = [];
    for (var i = 0; i < part.length; ++i) {
      var c = part.charAt(i);
      if (c == '?') {
        exp.push("[^:]");
      } else if (c == '*') {
        exp.push("[^:]*");
      } else {
        if (special.indexOf(c) >= 0) {
          exp.push("\\");
        }
        exp.push(c);
      }
    }
    return exp.join("");
  }

  var statements = [];
  for (var i=0; i<permissions.length; i++){
    statements.push(compilePermission(permissions[i]));
  }
  var result = statements.join("|");
  if (statements.length > 1) result = "(" + result + ")";
  return new RegExp("^" + result + "(\\:.*)*$");
}

},{}]},{},[1])(1)
});