/*jshint browser:true */
/*global require */

/**
 * @fileOverview
 * Contains unit tests for the userlist common library.
 */

describe('userlist', function() {
  'use strict';

  var assert = window.assert;
  var sinon = window.sinon;

  var UserCache = require('usercache');
  var Emitter = require('emitter');
  var usercache;

  function MockKey(name) {
    this._emitter = new Emitter();
    this.name = name;
    this.get = sinon.stub().yields();
    this.on = function(evt, options, cb) {
      this._emitter.on(evt, options.listener);
      cb();
    };
    this.off = function(evt, listener, cb) {
      this._emitter.off(evt, listener);
      cb();
    };
  }

  var mockUsers = {
    local: { id: 'local' },
    one: { id: 'one' },
    two: { id: 'two' }
  };

  var mockUserKeys = {
    local: new MockKey('/.users/local'),
    one: new MockKey('/.users/one'),
    two: new MockKey('/.users/two')
  };

  var mockRoom;

  beforeEach(function(done) {
    mockRoom = {
      _emitter: new Emitter(),
      users: sinon.stub().yields(null, mockUsers, mockUserKeys),
      user: sinon.stub().yields(null, mockUsers.local),
      on: function(evt, listener, cb) {
        this._emitter.on(evt, listener);
        cb();
      },
      off: function(evt, listener, cb) {
        this._emitter.off(evt, listener);
        cb();
      },
      key: function(name) { return new MockKey(name); }
    };

    usercache = new UserCache(mockRoom);
    usercache.initialize(done);
  });

  afterEach(function(done) {
    usercache.destroy(done);
  });

  describe('getUser', function() {
    it('Throws if the user does not exist', function() {
      assert.exception(function() {
        usercache.getUser('fakeId');
      });
    });

    it('Returns the specified user', function() {
      assert.equal(usercache.getUser('one'), mockUsers.one);
      assert.equal(usercache.getUser('two'), mockUsers.two);
    });
  });

  describe('getAll', function() {
    it('Returns all users', function() {
      var all = usercache.getAll();
      assert.include(all, mockUsers.local);
      assert.include(all, mockUsers.one);
      assert.include(all, mockUsers.two);
    });
  });

  describe('getLocalUser', function() {
    it('Returns the local user', function() {
      assert.equal(usercache.getLocalUser(), mockUsers.local);
    });
  });

  describe('getUserKey', function() {
    it('Throws if the user id does not exist', function() {
      assert.exception(function() {
        usercache.getUserKey('fakeid');
      });
    });

    it('Returns the key for the specified user', function() {
      assert.equal(usercache.getUserKey('one'), mockUserKeys.one);
      assert.equal(usercache.getUserKey('two'), mockUserKeys.two);
    });
  });

  describe('getAllUserKeys', function() {
    it('Returns a key for each user', function() {
      var all = usercache.getAllUserKeys();
      assert.include(all, mockUserKeys.local);
      assert.include(all, mockUserKeys.one);
      assert.include(all, mockUserKeys.two);
    });
  });

  describe('getLocalUserKey', function() {
    it('Returns the local user key', function() {
      assert.equal(usercache.getLocalUserKey(), mockUserKeys.local);
    });
  });

  describe('on', function() {
    it('Throws for invalid events', function() {
      assert.exception(function() {
        usercache.on('invalidevent', function(){});
      }, 'Invalid event: "invalidevent" is not a valid event.');
    });

    it('Throws for invalid listeners', function() {
      assert.exception(function() {
        usercache.on('join', '');
      }, 'Invalid argument: listener function is required');
    });

    it('Adds listeners that get triggered', function(done) {
      var newUser = { id: 'newUser' };

      // Stub out the platform interactions that are needed to trigger the
      // "change" handler.
      var usersKey = new MockKey('/.users');
      var userKey = new MockKey('/.users/newUser');
      userKey.get = sinon.stub().yields(null, newUser);

      var stub = sinon.stub(mockRoom, 'key');
      stub.returns(userKey);
      stub.withArgs('/.users').returns(usersKey);

      var join = sinon.spy();
      var leave = sinon.spy();
      var change = sinon.spy();

      // Have to make a new instance that uses our stubbed out room/keys.
      var cache = new UserCache(mockRoom);
      cache.initialize(function(err) {
        assert.ifError(err);

        cache.on('join', join);
        cache.on('leave', leave);
        cache.on('change', change);

        mockRoom._emitter.emit('join', newUser);
        sinon.assert.calledWith(join, newUser);

        mockRoom._emitter.emit('leave', newUser);
        sinon.assert.calledWith(leave, newUser);

        usersKey._emitter.emit('set', 'someValue', { userId: 'newUser' });
        sinon.assert.calledWith(change, newUser);

        cache.destroy(done);
      });
    });
  });

  describe('off', function() {
    it('Removes a specific listener', function() {
      var listener = sinon.spy();
      var listener2 = sinon.spy();

      usercache.on('join', listener);
      usercache.on('join', listener2);
      usercache.off('join', listener);

      var newUser = { id: 'newUser' };
      mockRoom._emitter.emit('join', newUser);

      sinon.assert.notCalled(listener);
      sinon.assert.called(listener2);
    });

    it('Removes all listeners for an event', function() {
      var listener = sinon.spy();
      var listener2 = sinon.spy();

      usercache.on('join', listener);
      usercache.on('join', listener2);
      usercache.off('join');

      var newUser = { id: 'newUser' };
      mockRoom._emitter.emit('join', newUser);

      sinon.assert.notCalled(listener);
      sinon.assert.notCalled(listener2);
    });

    it('Removes all listeners', function() {
      var listener = sinon.spy();
      var listener2 = sinon.spy();

      usercache.on('join', listener);
      usercache.on('leave', listener2);
      usercache.off();

      var newUser = { id: 'newUser' };
      mockRoom._emitter.emit('join', newUser);
      mockRoom._emitter.emit('leave', newUser);

      sinon.assert.notCalled(listener);
      sinon.assert.notCalled(listener2);
    });
  });
});
