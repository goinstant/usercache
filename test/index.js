/*jshint browser:true */
/*global require */

/**
 * @fileOverview
 * Contains unit tests for the usercache common library.
 */

describe('usercache', function() {
  'use strict';

  var assert = window.assert;
  var sinon = window.sinon;

  var UserCache = require('usercache');
  var Emitter = require('emitter');
  var _ = require('lodash');
  var usercache;

  function MockKey(name) {
    this._emitter = new Emitter();
    this.name = name;
    this.get = sinon.stub().yields(null, storage(name));
    this.on = function(evt, options) {
      this._emitter.on(evt, options.listener);
    };
    this.off = function(evt, listener) {
      this._emitter.off(evt, listener);
    };
  }

  function storage(name) {
    var path = name.split('/');
    path.splice(0,1);

    var value = _.clone(dataStore);

    _.each(path, function(key) {
      value = value[key];
    });

    return value;
  }

  var mockUsers = {
    local: { id: 'local' },
    one: { id: 'one' },
    two: { id: 'two' }
  };

  var dataStore = {
    ".users": mockUsers
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
      users: new MockKey('/.users'),
      user: function(id) { return mockUserKeys[id]; },
      self: sinon.stub().returns(mockUserKeys.local),
      on: function(evt, listener) {
        this._emitter.on(evt, listener);
      },
      off: function(evt, listener) {
        this._emitter.off(evt, listener);
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

  describe('custom user keys', function() {
    it('A custom key gets added to the cached user object', function() {
      var fakeValue = 'value';

      var fakeContext = {
        key: '/.users/local/test'
      };

      var expectedUser = _.cloneDeep(usercache.getUser('local'));
      expectedUser.test = fakeValue;

      usercache._updateUser(fakeValue, fakeContext);

      var updatedUser = usercache.getUser('local');

      assert.deepEqual(updatedUser, expectedUser);
    });

    it('Nested custom keys get added to the cached user object', function() {
      var fakeValue = {
        test5: {
          test6: 'value'
        }
      };

      var fakeContext = {
        key: '/.users/one/test1/test2/test3/test4'
      };

      var expectedUser = _.cloneDeep(usercache.getUser('one'));
      expectedUser.test1 = {
        test2: {
          test3: {
            test4: fakeValue
          }
        }
      };

      usercache._updateUser(fakeValue, fakeContext);

      var updatedUser = usercache.getUser('one');

      assert.deepEqual(updatedUser, expectedUser);
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

    it('Adds listeners that get triggered', function() {
      var newUser = { id: 'newUser' };

      var join = sinon.spy();
      var leave = sinon.spy();
      var change = sinon.spy();

      usercache.on('join', join);
      usercache.on('leave', leave);
      usercache.on('change', change);

      mockRoom._emitter.emit('join', newUser);
      sinon.assert.calledWith(join, newUser);

      var context = {
        userId: 'newUser',
        key: '/.users/newUser/someKey'
      };

      mockRoom.users._emitter.emit('set', 'someValue', context);
      sinon.assert.calledWith(change, newUser, context.key);

      mockRoom._emitter.emit('leave', newUser);
      sinon.assert.calledWith(leave, newUser);
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
