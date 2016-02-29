var expect = require('expect.js');
var sinon = require('sinon');
var request = require('request');
var fs = require('fs');
var childProcess = require('child_process');
var tar = require('tar');
var client = require('../lib/client');

describe('Finalizer client', function() {
    afterEach(function() {
        request.post.restore();

        if (fs.createWriteStream.restore) {
            fs.createWriteStream.restore();
        }
        if (childProcess.spawn.restore) {
            childProcess.spawn.restore();
        }
        if (tar.Extract.restore) {
            tar.Extract.restore();
        }
    });

    it('should create a new project on the build server', function(done) {
        var jsonResponse = { msg: 'Project "my-project" created' };
        sinon.stub(request, 'post')
            .yields(null, { statusCode: 200 }, JSON.stringify(jsonResponse));

        client.create('my-project', function(err, body) {
            expect(request.post.called).to.be.ok();
            expect(request.post.callCount).to.be(1);
            expect(body).to.be('Project "my-project" created');
            done();
        });
    });
});
