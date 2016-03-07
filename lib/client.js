var request = require('request');
var fs = require('fs');
var tar = require('tar');
var childProcess = require('child_process');
var settings = require('./settings');
var client = {};
var baseUrl = settings.baseUrl + '/api';

/**
 * Create a new project.
 * @param  {String} name
 * @param  {Function} callback
 * @return {null}
 */
client.create = function(name, callback) {
    var dependencies = process.cwd() + '/package.json';
    if (!fs.existsSync(dependencies)) {
        return callback('package.json doesn\'t exists. Can\'t create project "' + name + '"');
    }

    var data = {
        name: name,
        dependencies: JSON.parse(fs.readFileSync(dependencies))
    };
    request.post(baseUrl + '/create', { form: data }, function(err, res, body) {
        var body = JSON.parse(body);
        if (!err && res.statusCode === 200) {
            return callback(null, body.msg);
        }
        callback(body.msg);
    });
}

/**
 * Download the latest build from the project.
 * @param  {String}   name
 * @param  {Function} callback
 * @return {null}
 */
client.download = function(name, callback) {
    var data = { name: name };
    var tarFile = 'compressed.tar.gz';
    var dependencies = fs.createWriteStream(tarFile);

    dependencies.on('finish', function() {
        console.log('compressed.tar.gz downloaded...');
        console.log('Extracting the tar...');
        extractDependencies('node_modules', function() {
            console.log('Extract completed.');
            var child = childProcess.spawn('npm', ['rebuild'], { silent: true });
            child.on('close', function() {
                if (fs.existsSync(tarFile)) {
                    fs.unlinkSync(tarFile);
                }
                callback(null, 'Downloaded and rebuilt dependencies for "' + name + '"');
                return;
            });
        });
    });

    var response = request.post(baseUrl + '/download', { form: data });
    response.on('error', function(err) {
        callback(err);
    });
    response.pipe(dependencies);
}

/**
 * Build a new version of the project dependencies.
 * @param  {String}   name
 * @param  {Function} callback
 * @return {null}
 */
client.build = function(name, callback) {
    var dependencies = process.cwd() + '/package.json';
    if (!fs.existsSync(dependencies)) {
        return callback('package.json doesn\'t exists. Can\'t create new build for project "' + name + '"');
    }

    var data = {
        name: name,
        dependencies: JSON.parse(fs.readFileSync(dependencies))
    };
    request.post(baseUrl + '/build', { form: data }, function(err, res, body) {
        var body = JSON.parse(body);
        if (!err && res.statusCode === 200) {
            return callback(null, body.msg);
        }
        callback(body.msg);
    });
}

function extractDependencies(path, callback) {
    var extractor = tar.Extract({ path: path, strip: 1 })
        .on('error', function(err) {
            console.log(err);
        })
        .on('end', function() {
            callback();
        });

    fs.createReadStream(process.cwd() + '/compressed.tar.gz')
        .on('error', function(err) {
            console.log(err);
        })
        .pipe(extractor);
}

module.exports = client;
