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
    let settings = loadSettings();
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
    let settings = loadSettings();
    var dependencies = process.cwd() + '/package.json';
    var firstTime = fs.existsSync(process.cwd() + '/node_modules');
    var data = {
        name: name,
        first: !firstTime,
        buildId: settings.buildId
        // dependencies: JSON.parse(fs.readFileSync(dependencies))
    };


    var tarFile = 'compressed.tar.gz';
    var tarFileDownloaded = false;
    var buildId = null;
    var compressedDependencies = fs.createWriteStream(tarFile);

    compressedDependencies.on('error', function(err) {
        return callback('An error ocurred while writing the dependencies .tar file. Please try again :S');
    });

    compressedDependencies.on('finish', function() {
        if (tarFileDownloaded) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write('\u2713');

            console.log(' Downloaded compressed.tar.gz. Extracting...');

            extractDependencies('node_modules', function(err) {
                if (err) {
                    return callback(err);
                }
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write('\u2713');

                console.log(' Extract completed.');
                // console.log('Now rebuilding node_modules links...');

                // var child = childProcess.spawn('npm', ['rebuild']);

                // child.on('close', function() {

                    if (fs.existsSync(tarFile)) {
                        fs.unlinkSync(tarFile);
                    }

                    writeBuildId(buildId, settings, name, callback);

                // });
            });
        }
    });

    var response = request.post(baseUrl + '/download', { form: data });
    var loader = ['/', '-', '\\', '|'];
    var index = 0;
    var length = 0;
    var totalLength = 1;
    response.on('data', function(data) {
        // show a pretty download progress bar?
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(loader[index]);
        // console.log(data.size);
        //
        length += data.length;

        // console.log(response.headers['content-length']);
        var percent = ((length / totalLength) * 100).toFixed(2);
        // console.log(percent);
        process.stdout.write(' ' + percent + '%');
        index ++;

        if (index == 4) {
            index = 0;
        }
    });

    response.on('response', function(res) {
        totalLength = parseInt(res.headers['content-length']);
        const headers = res.headers;
        buildId = headers['build-id-header'];
        if (res.statusCode !== 200) {
            if (fs.existsSync(tarFile)) {
                fs.unlinkSync(tarFile);
            }
            return callback(res.headers['error-message']);
        }

        // if we get a 200 response from the server, this value will be set.
        // Now, no matter what response we get, the "compressedDependencies" stream
        // will still be piped (with nothing) and that "finish" event will still occur.
        // I can't figure out a way to maybe stop piping or to not pipe at all,
        // if the response is not a 200
        // I think this is not a good approach and can be handled better.
        tarFileDownloaded = true;
    });
    response.on('error', function(err) {
        return callback(err);
    });
    response.pipe(compressedDependencies);
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
        console.log(baseUrl + '/check');
        if (!err && res.statusCode === 200) {
            var body = JSON.parse(body);
            return callback(null, body.msg + '! Connection established.');
        }
        return callback('Connection to build server not established. Check your finalizer.json file.');
    });
}

function extractDependencies(path, callback) {
    var loader = ['/', '-', '\\', '|'];
    var index = 0;
    var extractor = tar.Extract({ path: path, strip: 1 })
        .on('error', function(err) {
            return callback(err);
        })
        .on('end', function() {
            return callback(null);
        })
        .on('data', function() {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(loader[index]);
            index ++;

            if (index == 4) {
                index = 0;
            }
        });

    fs.createReadStream(process.cwd() + '/compressed.tar.gz')
        .on('error', function(err) {
            return callback(err);
        })
        .pipe(extractor);
}


function writeBuildId (buildId, settings, name, callback) {
    if (buildId) {
        settings.buildId = buildId;
        fs.writeFile(process.cwd() + '/finalizer.json', JSON.stringify(settings), function(err) {
            if (err) {
                console.log(err);
                return callback('There was an error adding build ID to the finalizer.json file.');
            }
            console.log('build id saved');
            return callback(null, 'Downloaded and rebuilt dependencies for "' + name + '"');
        });
    } else {
        return callback(null, 'Downloaded and rebuilt dependencies for "' + name + '"');
    }
}


/**
 * Load basic settings from finalizer.json file.
 * @return {null}
 */
function loadSettings() {
    var settings = require('./settings');
    baseUrl = settings.baseUrl + '/api';

    return settings;
}

module.exports = client;
