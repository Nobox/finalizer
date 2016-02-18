var request = require('request');
var fs = require('fs');
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
        dependencies: fs.readFileSync(dependencies)
    };
    request.post(baseUrl + '/create', { form: data }, function(err, res, body) {
        if (!err && res.statusCode === 200) {
            callback(body);
        } else {
            console.log(err);
        }
    });
}

module.exports = client;
