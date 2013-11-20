/*jshint browser:true */
/*global module, require */
'use strict';

/**
 * @fileOverview
 * Contains the UserCache class, which is responsible for storing all user
 * objects currently in the room.
 */

var _ = require('lodash');
var async = require('async');
var Emitter = require('emitter');

var VALID_EVENTS = ['join', 'leave', 'change'];

/**
 * Instantiates the UserCache instance.
 * @constructor
 * @param {object} room
 */
function UserCache(room) {
  this._room = room;

  this._users = {};
  this._usersKeys = {};
  this._localUserId = null;

  this._emitter = new Emitter();

  _.bindAll(this, [
    '_updateUser',
    '_handleLeaveEvent',
    '_handleJoinEvent'
  ]);
}

/**
 * Initializes the UserCache by binding to platform events.
 * @param {function} cb A callback function.
 */
UserCache.prototype.initialize = function(cb) {
  if (!cb || !_.isFunction(cb)) {
    throw new Error('Callback was not found or invalid');
  }

  this._getLocalUserId();
  this._bindEvents();

  var self = this;

  this._getUsers(function(err) {
    if (err) {
      self.destroy();
      return cb(err);
    }

    cb();
  });
};

/**
 * Destroys the UserCache instance.
 * @public
 */
UserCache.prototype.destroy = function() {
  var users = this._room.users;

  var usersSetOptions = {
    local: true,
    bubble: true,
    listener: this._updateUser
  };

  this._room.off('leave', this._handleLeaveEvent);
  this._room.off('join', this._handleJoinEvent);
  users.off('set', usersSetOptions);
  users.off('remove', usersSetOptions);

  this._emitter.off();
};

/**
 * Returns the locally stored user object.
 * @param {string} id The user object ID.
 * @return {object} The user object matching the given id.
 */
UserCache.prototype.getUser = function(id) {
  var user = this._users[id];

  if (!user) {
    throw new Error('Invalid id: user not found.');
  }

  return user;
};

/**
 * Returns all users.
 * @return {object[]} All user objects in an array.
 */
UserCache.prototype.getAll = function() {
  return _.toArray(this._users);
};

/**
 * Returns the local user object.
 * @return {object} The local user's object.
 */
UserCache.prototype.getLocalUser = function() {
  return this.getUser(this._localUserId);
};

/**
 * Returns the locally stored user key.
 * @param {string} id The user's id.
 * @return {object} The user key matching the given id.
 */
UserCache.prototype.getUserKey = function(id) {
  var userKey = this._usersKeys[id];

  if (!userKey) {
    throw new Error('Invalid id: user key not found.');
  }

  return userKey;
};

/**
 * Returns all user keys.
 * @return {object[]} All user key objects in an array.
 */
UserCache.prototype.getAllUserKeys = function() {
  return _.toArray(this._usersKeys);
};

/**
 * Returns the local user's key.
 * @return {object} The local user's key.
 */
UserCache.prototype.getLocalUserKey = function() {
  return this._room.self();
};

/**
 * Register an event handler.
 * @param {string} event The event to listen for. Accepts: join, leave, change.
 * @param {function} listener The listener to call when an event occurs.
 */
UserCache.prototype.on = function(event, listener) {
  if (!_.contains(VALID_EVENTS, event)) {
    throw new Error('Invalid event: \"' + event + '\" is not a valid event.');
  }

  if (!_.isFunction(listener)) {
    throw new Error('Invalid argument: listener function is required');
  }

  this._emitter.on(event, listener);
};

/**
 * Remove an event handler.
 * @param {string} event The event to listen for. Accepts: join, leave, change.
 * @param {function} listener The listener to call when an event occurs.
 */
UserCache.prototype.off = function(event, listener) {
  /*jshint unused: false */
  // Emitter#off relies on the number of arguments supplied, don't pass through
  // undefineds.
  var args = Array.prototype.slice.call(arguments);
  this._emitter.off.apply(this._emitter, args);
};

/**
 * Gets the local user's ID
 * @private
 */
UserCache.prototype._getLocalUserId = function() {
  var selfKey = this._room.self();
  var path = selfKey.name.split('/');

  this._localUserId = path[2];
};

/**
 * Fetches the initial list of users.
 * @private
 * @param {function} cb A callback function.
 */
UserCache.prototype._getUsers = function(cb) {
  var usersKey = this._room.users;

  var self = this;

  usersKey.get(function(err, users) {
    if (err) {
      return cb(err);
    }

    self._users = users;

    // Create a reference to each user's key
    _.each(users, function(userObj, keyName) {
      self._usersKeys[keyName] = self._room.user(keyName);
    });

    cb();
  });
};

/**
 * Binds to room.join, room.leave and user key.set/key.remove
 * @private
 */
UserCache.prototype._bindEvents = function() {
  var users = this._room.users;

  var usersSetOptions = {
    local: true,
    bubble: true,
    listener: this._updateUser
  };

  this._room.on('leave', this._handleLeaveEvent);
  this._room.on('join', this._handleJoinEvent);
  users.on('set', usersSetOptions);
  users.on('remove', usersSetOptions);
};

/**
 * Updates a locally stored user object with the changed/new properties and
 * emits a 'change' event.
 * @private
 * @param {object} value The value of the key upon the listener being fired.
 * @param {context} context A key context object for the event.
 */
UserCache.prototype._updateUser = function(value, context) {
  var path = context.key.split('/');
  var userKeyPath = path.slice(3);

  var user = this._users[context.userId];

  var currentKey = user;

  for (var i = 0; i < userKeyPath.length -1; i++) {
    var key = userKeyPath[i];
    currentKey = currentKey[key] = {};
  }

  var lastKey = _.last(userKeyPath);
  currentKey[lastKey] = value;

  this._emitter.emit('change', user, context.key);
};

/**
 * Adds/updates the users map with a new user object and emits a 'join' event.
 * @private
 * @param {object} user A user object.
 */
UserCache.prototype._handleJoinEvent = function(user) {
  this._users[user.id] = user;
  this._usersKeys[user.id] = this._room.user(user.id);

  this._emitter.emit('join', user);
};

/**
 * Removes the user object from the users map and emits a 'leave' event.
 * @private
 * @param {object} user A user object.
 */
UserCache.prototype._handleLeaveEvent = function(user) {
  delete this._users[user.id];
  delete this._usersKeys[user.id];

  this._emitter.emit('leave', user);
};

module.exports = UserCache;
