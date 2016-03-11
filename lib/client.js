var request = require('request');
var fs = require('fs');
var tar = require('tar');
var childProcess = require('child_process');
var client = {};
var baseUrl = '';

/**
 * Create a new project.
 * @param  {String} name
 * @param  {Function} callback
 * @return {null}
 */
client.create = function(name, callback) {
    var finalizerFile = process.cwd() + '/finalizer.json';
    if (!fs.existsSync(finalizerFile)) {
        return callback('finalizer.json doesn\'t exists. Please, run "finalizer init"');
    }
    loadSettings();
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
    var finalizerFile = process.cwd() + '/finalizer.json';
    if (!fs.existsSync(finalizerFile)) {
        return callback('finalizer.json doesn\'t exists. Please, run "finalizer init"');
    }
    loadSettings();
    var dependencies = process.cwd() + '/package.json';
    var data = {
        name: name,
        dependencies: JSON.parse(fs.readFileSync(dependencies))
    };
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
    var finalizerFile = process.cwd() + '/finalizer.json';
    if (!fs.existsSync(finalizerFile)) {
        return callback('finalizer.json doesn\'t exists. Please, run "finalizer init"');
    }
    loadSettings();
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

/**
 * Generate a basic finalizer.json file.
 * @param  {Function} callback
 * @return {null}
 */
client.init = function(callback) {
    var finalizerFile = process.cwd() + '/finalizer.json';
    var data = {
        baseUrl: 'http://localhost:8000'
    };

    if (fs.existsSync(finalizerFile)) {
        return callback('finalizer.json file already exists.');
    }
    fs.writeFile(process.cwd() + '/finalizer.json', JSON.stringify(data), function(err) {
        if (err) {
            console.log(err);
            return callback('There was an error creating the finalizer.json file.');
        }
        return callback(null, 'finalizer.json file created.');
    });
}

/**
 * Check connection to the build server.
 * @param  {Function} callback
 * @return {null}
 */
client.check = function(callback) {
    var finalizerFile = process.cwd() + '/finalizer.json';
    if (!fs.existsSync(finalizerFile)) {
        return callback('finalizer.json doesn\'t exists. Please, run "finalizer init"');
    }
    loadSettings();
    var data = {
        status: 'PING'
    };
    request.post(baseUrl + '/check', { form: data }, function(err, res, body) {
        var body = JSON.parse(body);
        if (!err && res.statusCode === 200) {
            return callback(null, body.msg + '! Connection established.');
        }
        return callback('Connection to build server not established. Check your finalizer.json file.');
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

/**
 * Load basic settings from finalizer.json file.
 * @return {null}
 */
function loadSettings() {
    var settings = require('./settings');
    baseUrl = settings.baseUrl + '/api';
}

module.exports = client;
