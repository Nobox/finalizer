var expect = require('expect.js');
var sinon = require('sinon');
var request = require('request');
var client = require('../lib/client');

describe('Finalizer client', function() {
    before(function() {
        sinon.stub(request, 'post')
            .yields(null, { statusCode: 200 }, 'Project "my-project" created');
    });

    after(function() {
        request.post.restore();
    });

    it('should create a new project by calling the endpoint on the build server', function(done) {
        client.create('my-project', function(body) {
            expect(request.post.called).to.be.ok();
            expect(request.post.callCount).to.be(1);
            expect(body).to.be('Project "my-project" created');
            done();
        });
    });
});
