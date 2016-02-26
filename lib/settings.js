var fs = require('fs');
var contents = fs.readFileSync(process.cwd() + '/finalizer.json');

module.exports = JSON.parse(contents);
