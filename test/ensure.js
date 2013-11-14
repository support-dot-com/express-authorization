var assert = require('assert');
var authorization = require('../');

describe('ensureRequest', function() {
  function httpContextMock(result, done) {
    var self = this;
    this.done = done;
    this.result = result;
    result.redirectedTo = undefined;
    result.nextCalled = false;
    this.req = {
      session: {
        user: {
          permissions: [ "identity:view", "session:*", "system:list,view,edit", "version:v2??" ]
        }
      }
    };
    this.res = {
      redirect: function (url) {
        self.result.redirectedTo = url;
        if (self.done) self.done();
      }
    }
    this.next = function() {
      self.result.nextCalled = true;
      if (self.done) self.done();
    }
  }

  function checkMiddleware(middleware, result, done, check) {
    var httpContext = new httpContextMock(result, function () {
      try {
        check(result);
        done();
      } catch(e) {
        done(e);
      }
    });
    middleware(httpContext.req, httpContext.res, httpContext.next);
  }

  function checkPermitted(result) {
    assert.equal(result.redirectedTo, undefined);
    assert.equal(result.nextCalled, true);
  }

  function checkDenied(result) {
    assert.equal(result.redirectedTo, '/login');
    assert.equal(result.nextCalled, false);
  }

  function checkRedirectedElsewhere(result) {
    assert.equal(result.redirectedTo, '/elsewhere');
    assert.equal(result.nextCalled, false);
  }

  it ('permitted', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.isPermitted("identity:view");
    checkMiddleware(middleware, result, done, checkPermitted);
  });

  it ('permitted asserting multiple permissions', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.isPermitted("identity:view", "system:list");
    checkMiddleware(middleware, result, done, checkPermitted);
  });

  it ('denied', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.isPermitted("identity:edit");
    checkMiddleware(middleware, result, done, checkDenied);
  });

  it ('denied asserting multiple permissions', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.isPermitted(["identity:view", "system:reboot"]);
    checkMiddleware(middleware, result, done, checkDenied);
  });

  it ('denied redirectTo', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.redirectTo('/elsewhere').isPermitted("identity:edit");
    checkMiddleware(middleware, result, done, checkRedirectedElsewhere);
  });

  it ('or custom permission check - permitted', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.isPermitted(function (claim) {
      return claim.isPermitted("identity:edit") || claim.isPermitted("identity:view");
    });
    checkMiddleware(middleware, result, done, checkPermitted);
  });

  it ('and custom permission check - denied', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.isPermitted(function (claim) {
      return claim.isPermitted("identity:edit") && claim.isPermitted("identity:view");
    });
    checkMiddleware(middleware, result, done, checkDenied);
  });

  it ('denied handler', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.onDenied(function (req, res, next) {
      result.onDeniedCalled = true;
      res.redirect('/elsewhere');
    }).isPermitted("identity:edit");
    checkMiddleware(middleware, result, done, function() {
      assert.equal(result.onDeniedCalled, true);
      checkRedirectedElsewhere(result);
    });
  });

  it ('custom considerPermissions', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.withPermissions(function (req, res) {
      result.withPermissionsCalled = true;
      return ["identity:*"];
    }).isPermitted("identity:edit");
    checkMiddleware(middleware, result, done, function() {
      assert.equal(result.withPermissionsCalled, true);
      checkPermitted(result);
    });
  });

  it ('custom asynchronous considerPermissions', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.withPermissions(function (req, res, done) {
      result.withPermissionsCalled = true;
      done(["identity:*"]);
    }).isPermitted("identity:edit");
    checkMiddleware(middleware, result, done, function() {
      assert.equal(result.withPermissionsCalled, true);
      checkPermitted(result);
    });
  });

  it ('custom considerSubject', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.withSubject(function (req, res) {
      result.withPermissionsCalled = true;
      var user = {
        username: "administrator",
        permissions: "*:*"
      };
      return user;
    }).isPermitted("identity:edit");
    checkMiddleware(middleware, result, done, function() {
      assert.equal(result.withPermissionsCalled, true);
      checkPermitted(result);
    });
  });

  it ('custom asynchronous considerSubject', function(done) {
    var result = {};
    var middleware = authorization.ensureRequest.withSubject(function (req, res, done) {
      result.withPermissionsCalled = true;
      var user = {
        username: "administrator",
        permissions: "*:*"
      };
      done(user);
    }).isPermitted("identity:edit");
    checkMiddleware(middleware, result, done, function() {
      assert.equal(result.withPermissionsCalled, true);
      checkPermitted(result);
    });
  });

  it ('permitted new EnsureRequest', function(done) {
    var result = {};
    var ensureRequest = new authorization.EnsureRequest();
    var middleware = ensureRequest.isPermitted("identity:view");
    checkMiddleware(middleware, result, done, checkPermitted);
  });

  it ('custom options', function(done) {
    var result = {};
    // Global default options can be set on authorization.ensureRequest.options
    var ensureRequest = new authorization.EnsureRequest();
    ensureRequest.options.redirectTo = '/elsewhere';
    var middleware = ensureRequest.isPermitted("identity:edit");
    checkMiddleware(middleware, result, done, checkRedirectedElsewhere);
  });
});
