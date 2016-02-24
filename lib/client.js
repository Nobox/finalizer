var request = require('request');
var fs = require('fs');
var tar = require('tar');
var childProcess = require('child_process');
var client = {};
var baseUrl = 'http://localhost:8080/api';

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
    var response = request.post(baseUrl + '/download', { form: data }, function(err, res, body) {
        var body = JSON.parse(body);
        if (!err && res.statusCode === 200) {
            extractDependencies('node_modules', function() {
                var child = childProcess.spawn('npm', ['rebuild'], { silent: true });
                child.on('close', function() {
                    if (fs.existsSync(tarFile)) {
                        fs.unlinkSync(tarFile);
                    }
                    callback(null, 'Downloaded and rebuilt dependencies for "' + name + '"');
                    return;
                });
            });
        } else {
            if (fs.existsSync(tarFile)) {
                fs.unlinkSync(tarFile);
            }
            callback(body.msg);
        }
    });
    response.on('error', function(err) {
        callback(err);
    });
    response.pipe(dependencies);
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
