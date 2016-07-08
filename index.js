#! /usr/bin/env node
var finalizer = require('commander');
var client = require('./lib/client');

finalizer
    .command('create <name>')
    .description('Create a new project.')
    .action(function(name) {
        console.log('Attempting to create project "' + name + '"');
        client.create(name, function(err, body) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(body);
        });
    });

finalizer
    .command('build <name>')
    .description('Run a new project build.')
    .action(function(name) {
        console.log('Attempting to create a new build for "' + name + '"');
        client.build(name, function(err, msg) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(msg);
        });
    });

finalizer
    .command('download <name>')
    .description('Download the latest project build.')
    .action(function(name) {
        console.log('Trying to download the latest build for "' + name + '"');
        client.download(name, function(err, msg) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(msg);
        });
    });

finalizer
    .command('init')
    .description('Generate a basic finalizer.json file.')
    .action(function() {
        client.init(function(err, msg) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(msg);
        });
    });

finalizer
    .command('check')
    .description('Check if connection to the build server is successful.')
    .action(function() {
        client.check(function(err, msg) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(msg);
        });
    });

finalizer.version('0.2.2');
finalizer.parse(process.argv);
