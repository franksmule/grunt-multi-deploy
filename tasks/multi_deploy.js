/*
 * grunt-multi-deploy
 * https://github.com/root/multi-deploy
 *
 * Copyright (c) 2013 Ollie McFarlane
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
	var options;
	var target;
	grunt.registerMultiTask('multi_deploy', 'Grunt multi deploy plugin', function() {
		var done = this.async();
		this.target = grunt.option('target');
		// Merge task-specific and/or target-specific options with these defaults.

		if (!this.target) {
			throw new TypeError('Please pass a target to deploy to with --target');
			return;
		}

		var defaults = {};
		defaults[this.target] = {
			address: "localhost",
			port:22,
			password:""
		};
		
		this.options = this.options(defaults);
		this.currentServer = this.options.servers[this.target];
		var path = require('path');
		this.lastFolder = path.resolve().split("/");
		this.lastFolder = this.lastFolder[this.lastFolder.length-1];
		console.log(this.lastFolder);
		switch (this.currentServer.type) {
			case "sftp":
				checkSetup(this);
				deployToSSH(this);
				break;

		}

		function checkSetup(self) {

		}

		function compressFiles(self, callback) {
			// Uses JS Zip 
			var tar = require('tar');
			var path = require('path');
			var fstream = require('fstream');
			var fs = require('fs');

			fstream.Reader({ 
				path: path.resolve() + "/", 
				type: "Directory",
				filter: function () {
	            	 return !this.basename.match(self.options.ignore_folders)
				}
			}).pipe(tar.Pack()).pipe(fstream.Writer({
				path: "deploy.tar",
				mode: "0755"
				})).on("close", function () {
			 	console.error("Done tar");
			 	callback("deploy.tar");
			});
		}

		function deployToSSH(self) {
			//options.server.address;
			var path = require('path');
			var async = require('async');
			var moment = require('moment');
			var timeStamp = moment().format('YYYYMMDDHHmmssSSS');
			compressFiles(self, function(filename) {
				var Connection = require('ssh2');

				var c = new Connection();
				c.on('ready', function() {

					async.series([
					    function(callback){
					    	c.exec('mkdir -p ' + self.currentServer.working_path + ' && ' + 'mkdir -p ' + self.currentServer.working_path + "/" + timeStamp, function(err, stream) {
								c.sftp(function(err, sftp) {
									if (err) throw err;
									sftp.fastPut(path.resolve() + "/" + filename, self.currentServer.working_path + "/deploy.tar", function(err){
										if (err) throw err;
										sftp.chmod(self.currentServer.working_path + "/deploy.tar", "0755", function() {
											sftp.end();
											console.log("END SFTP");
											callback(false, false);
										});
									});
								});
							});
						},
					    function(callback){
					    	c.exec('tar xvf ' + self.currentServer.working_path + "/deploy.tar -C " + self.currentServer.working_path + "/" + timeStamp + " --strip 1 && rm -rf " + self.currentServer.working_path + "/" + timeStamp + "/" + self.lastFolder, function(err, stream) {
									if (err) throw err;
									console.log("Data extracted on remote");
									callback(false, false);
							});
					    },
					    function(callback){
					    	c.exec("rm -rf " + self.currentServer.run_path + " && ln -s " + self.currentServer.working_path  + "/" + timeStamp + " " + self.currentServer.run_path, function(err, stream) {
									if (err) throw err;
									console.log("Data extracted on remote");
							});
					    }
					]);
				})
				c.on('error', function(err) {
					console.log('Connection :: error :: ' + err);
				});

				var connectionObj = {
					host: self.currentServer.address,
					port: self.currentServer.port,
					username: self.currentServer.user,
				};

				if (self.currentServer.privateKey) {
					connectionObj.privateKey = require('fs').readFileSync(self.currentServer.private_key);
					if (self.currentServer.private_key_passphrase) {
						connectionObj.passphrase = self.currentServer.private_key_passphrase;
					}
				}
				else {
					connectionObj.password = self.currentServer.password;
				}
				c.connect(connectionObj);
			});
		}
	});
};