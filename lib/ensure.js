var consider = require('./consider');

function EnsureRequest(options) {
  options = options || {};
  this.options = {
    withSubject: options.withSubject,
    withPermissions: options.withPermissions,
    redirectTo: options.returnTo || '/login',
    onDenied: options.onDenied
  }
}

EnsureRequest.prototype.withSubject = function(getSubject) {
  var link = new EnsureRequest(this.options);
  link.options.withSubject = getSubject;
  return link;
}

EnsureRequest.prototype.withPermissions = function(getPermissions) {
  var link = new EnsureRequest(this.options);
  link.options.withPermissions = getPermissions;
  return link;
}

EnsureRequest.prototype.redirectTo = function(url) {
  var link = new EnsureRequest(this.options);
  link.options.redirectTo = url;
  return link;
}

EnsureRequest.prototype.onDenied = function(deny) {
  var link = new EnsureRequest(this.options);
  link.options.onDenied = deny;
  return link;
}

EnsureRequest.prototype.isPermitted = function(/* permission ... or [permission, ...] or permission check function */) {
  var withSubject = this.options.withSubject;
  var withPermissions = this.options.withPermissions;
  var redirectTo = this.options.redirectTo;
  var onDenied = this.options.onDenied;
  var isPermittedCheck;

  // Determine the permission check.
  if (arguments.length == 1 && typeof(arguments[0]) === 'function') {
    isPermittedCheck = arguments[0];
  } else {
    var permissions = arguments;
    isPermittedCheck = function(claim) {
      return claim.isPermitted.apply(claim, permissions);
    }
  }

  function withPermissionsDefault(req, res) {
    if (req.user && req.user.permissions) return req.user.permissions;
    if (req.session && req.session.user && req.session.user.permissions) return req.session.user.permissions;
    if (req.permissions) return req.permissions;
    return [];
  }

  var considerFunction = withSubject ? consider.considerSubject : consider.considerPermissions;
  var withFunctionCandidate = withSubject ? withSubject : withPermissions || withPermissionsDefault;
  var withFunction = withFunctionCandidate;

  // Convert synchronous with function to asynchronous
  if (withFunction.length != 3) {
    withFunction = function(req, res, done) {
      done(withFunctionCandidate(req, res));
    }
  }

  function onDeniedDefault(req, res, next) {
    res.redirect(redirectTo);
  }

  var onDeniedFunction = onDenied || onDeniedDefault;

  return function(req, res, next) {
    withFunction(req, res, function(permissionsOrSubject) {
      if (isPermittedCheck(considerFunction(permissionsOrSubject))) {
        next();
      } else {
        onDeniedFunction(req, res, next);
      }
    })
  }
}

exports = module.exports = new EnsureRequest();
exports.EnsureRequest = EnsureRequest;
