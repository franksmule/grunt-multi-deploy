/*
 * grunt-multi-deploy
 * https://github.com/root/multi-deploy
 *
 * Copyright (c) 2013 Ollie McFarlane
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
	jshint: {
	  all: [
		'Gruntfile.js',
		'tasks/*.js',
		'<%= nodeunit.tests %>',
	  ],
	  options: {
		jshintrc: '.jshintrc',
	  },
	},

	// Before generating any new files, remove any previously-created files.
	clean: {
	  tests: ['tmp'],
	},

	// Configuration to be run (and then tested).
	multi_deploy: {
	  params: {
		options: {
			servers: {
			  	testing: {
					type: 'sftp',
					address: "localhost",
					user:"root",
					password:"",
					working_path: "/home/node/deployTest",
					run_path: "/home/node/deployTest/current"
			  	},
		  	},
		  	// Folders to ignore, won't be transferred to remote server. Regex.
		  	ignore_folders:/^node_modules$|tar$/,
		  	target: "linux",
		},
	  
	  },
	},

	// Unit tests.
	nodeunit: {
	  tests: ['test/*_test.js'],
	},

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  //grunt.registerTask('test', ['clean', 'multi_deploy', 'nodeunit']);

  // By default, lint and run all tests.
  //grunt.registerTask('default', ['jshint', 'multi_deploy']);
  grunt.registerTask('default', ['multi_deploy']);


};
