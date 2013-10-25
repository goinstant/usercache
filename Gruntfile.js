/*jshint node:true*/
'use strict';

var path = require('path');
require('js-yaml');

var CLEAN_DIRS = [
  'components',
  'build'
];

var BROWSERS = require('./node_modules/browsers-yaml/browsers');

module.exports = function(grunt) {
  var COMPONENT_BIN_PATH = path.join(__dirname,
                                     'node_modules/component/bin/component');

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-saucelabs');

  grunt.initConfig({
    clean: CLEAN_DIRS,
    connect: {
      server: {
        options: {
          base: "",
          port: 9999
        }
      }
    },
    'saucelabs-mocha': {
      all: {
        options: {
          urls: ["http://localhost:9999/test/index.html"],
            tunnelTimeout: 5,
          build: process.env.TRAVIS_JOB_ID,
          concurrency: 8,
          browsers: BROWSERS,
          testname: "mocha tests",
          tags: ["master"]
        }
      }
    },
  });

  grunt.registerTask('test', ['build', 'connect', 'saucelabs-mocha']);

  // Jshint default task
  grunt.registerTask('build', [
    'clean',
    'component:install',
    'component:build:dev'
  ]);

  grunt.registerTask('component:install', function() {
    var done = this.async();

    var install = {
      cmd: COMPONENT_BIN_PATH,
      args: [ 'install', '-d' ]
    };

    // Build the component.

    grunt.log.writeln('component install - start');
    grunt.util.spawn(install, function(err) {
      if (err) {
        return done(err);
      }

      grunt.log.writeln('component install - done');

      done();
    });
  });

  grunt.registerTask('component:build:dev', function() {
    var done = this.async();

    var args = ['build', '-c', '-d'];

    var build = {
      cmd: COMPONENT_BIN_PATH,
      args: args
    };

    // Build the component.
    grunt.util.spawn(build, function(err) {
      if (err) {
        return done(err);
      }

      done();
    });
  });

};
