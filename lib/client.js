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
        // show warning that the package.json doesn't exists here,
        // stop the process and do nothing :)
    }

    var data = {
        name: name,
        dependencies: JSON.parse(fs.readFileSync(dependencies))
    };
    request.post(baseUrl + '/create', { form: data }, function(err, res, body) {
        if (!err && res.statusCode === 200) {
            callback(body);
        } else {
            console.log(err);
        }
    });
}

/**
 * Download the latest build from the project.
 * @param  {String}   name
 * @param  {Function} callback
 * @return {null}
 *
 * @todo Cleanup compressed .tar folder
 */
client.download = function(name, callback) {
    var data = { name: name };
    var tarFile = 'compressed.tar.gz';
    var dependencies = fs.createWriteStream(tarFile);
    var response = request.post(baseUrl + '/download', { form: data }, function(err, res, body) {
        if (!err && res.statusCode === 200) {
            extractDependencies('node_modules2', function() {
                var child = childProcess.spawn('npm', ['rebuild'], { silent: true });
                child.on('close', function() {
                    if (fs.existsSync(tarFile)) {
                        fs.unlinkSync(tarFile);
                    }
                    callback('Downloaded and rebuilt dependencies for "' + name + '"');
                });
            });
        } else {
            console.log(err);
        }
    });
    response.on('error', function(err) {
        console.log(err);
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
