/*!
 * connect-redirecthost - tests
 *
 * Copyright(c) 2011 M Gradek
 * MIT Licensed
 */

var vows = require('vows'),
    assert = require('assert'),
    factory = require('../lib/redirectHost');

var mockResponse = function(){
    var res = {};

    res.redirect = function(statusCode, to){
        this._statusCode = statusCode;
        this._location = to;
    };
    res.__defineGetter__('statusCode', function(){
        return this._statusCode;
    });
    res.__defineGetter__('location', function(){
        return this._location;
    });

    return res;
}

var mockRequest = function(url){
    var urlParts = require('url').parse(url);
    var req = {};

    req.headers = {};
    req.header = function(name){
        return this.headers[name.toLowerCase()];
    };

    req.hostname = urlParts.hostname;
    req.url = (urlParts.pathname || '') + (urlParts.search || '');

    return req;
}

var failNext = function(){
    assert.fail('next() must not be called');
}

var verifyRedirect = function(from, to){
    return function(middleware){
        var res = mockResponse();
        var req = mockRequest(from);

        middleware(req, res, failNext);
        assert.equal(res.statusCode, 301);
        assert.equal(res.location, to);

    };
}

var verifyNext = function(from){
    return function(middleware){
        var res = mockResponse();
        var req = mockRequest(from);
        var calledNext = false;

        middleware(req, res, function(){calledNext = true;});

        assert.isTrue(calledNext, 'next() was not called for \'' + from + '\'');
    };
}

vows.describe('Domain redirection').addBatch({
    'Throws errors when improperly initialized' : {
        topic : function(){return true},
        'throws errors when options is undefined': function(ignore){
            assert.throws(function(){factory.redirectHost()}, ReferenceError);
        }
    },
    'Redirect from many subdomains to single domain' : {
        topic : function(){
            return factory.redirectHost('www.example.com');
        },
        'middleware exists': function(middleware){
            assert.equal('function', typeof middleware);
        },
        'redirects from example.com to www.example.com': verifyRedirect(
            'http://example.com/',
            '//www.example.com/'),
        'redirects from anything.example.com to www.example.com': verifyRedirect(
            'http://anything.example.com/',
            '//www.example.com/'),
        'redirect preserves relative path': verifyRedirect(
            'http://example.com/some/path.htm',
            '//www.example.com/some/path.htm'),
        'redirect preserves relative path and search': verifyRedirect(
            'http://example.com/some/path.htm?key1=v1&key2=v2',
            '//www.example.com/some/path.htm?key1=v1&key2=v2'),
        'redirect avoided on www.example.com': verifyNext(
            'http://www.example.com'),
        'redirect avoided on www.example.com:80': verifyNext(
            'http://www.example.com:80'),
        'redirect avoided on www.example.com with path and query': verifyNext(
            'http://www.example.com/some/path.htm?key1=v1&key2=v2'),
        'redirect skipped for localhost': verifyNext(
            'http://localhost/'),
        'redirect skipped for localhost:3000': verifyNext(
            'http://localhost:3000/'),
        'redirect skipped for 127.0.0.1': verifyNext(
            'http://127.0.0.1/'),
        'redirect skipped for 127.0.0.1:3000': verifyNext(
            'http://127.0.0.1:3000/')
    },
    'Redirect by overriding protocol to http' : {
        topic : function(){
            return factory.redirectHost({to: 'www.example.com', protocol: 'http'});
        },
        'middleware exists': function(middleware){
            assert.equal('function', typeof middleware);
        },
        'redirects from example.com to www.example.com': verifyRedirect(
          'http://example.com/',
          'http://www.example.com/'),
        'redirects from anything.example.com to www.example.com': verifyRedirect(
          'http://anything.example.com/',
          'http://www.example.com/'),
        'redirect preserves relative path': verifyRedirect(
          'http://example.com/some/path.htm',
          'http://www.example.com/some/path.htm'),
        'redirect preserves relative path and search': verifyRedirect(
          'http://example.com/some/path.htm?key1=v1&key2=v2',
          'http://www.example.com/some/path.htm?key1=v1&key2=v2'),
        'redirect avoided on www.example.com': verifyNext(
          'http://www.example.com'),
        'redirect avoided on www.example.com:80': verifyNext(
          'http://www.example.com:80'),
        'redirect avoided on www.example.com with path and query': verifyNext(
          'http://www.example.com/some/path.htm?key1=v1&key2=v2'),
        'redirect skipped for localhost': verifyNext(
          'http://localhost/'),
        'redirect skipped for localhost:3000': verifyNext(
          'http://localhost:3000/'),
        'redirect skipped for 127.0.0.1': verifyNext(
          'http://127.0.0.1/'),
        'redirect skipped for 127.0.0.1:3000': verifyNext(
          'http://127.0.0.1:3000/')
    },
    'Redirect by overriding protocol to https' : {
        topic : function(){
            return factory.redirectHost({to: 'www.example.com', protocol: 'https'});
        },
        'middleware exists': function(middleware){
            assert.equal('function', typeof middleware);
        },
        'redirects from example.com to www.example.com': verifyRedirect(
          'http://example.com/',
          'https://www.example.com/'),
        'redirects from anything.example.com to www.example.com': verifyRedirect(
          'http://anything.example.com/',
          'https://www.example.com/'),
        'redirect preserves relative path': verifyRedirect(
          'http://example.com/some/path.htm',
          'https://www.example.com/some/path.htm'),
        'redirect preserves relative path and search': verifyRedirect(
          'http://example.com/some/path.htm?key1=v1&key2=v2',
          'https://www.example.com/some/path.htm?key1=v1&key2=v2'),
        'redirect avoided on www.example.com': verifyNext(
          'http://www.example.com'),
        'redirect avoided on www.example.com:80': verifyNext(
          'http://www.example.com:80'),
        'redirect avoided on www.example.com with path and query': verifyNext(
          'http://www.example.com/some/path.htm?key1=v1&key2=v2'),
        'redirect skipped for localhost': verifyNext(
          'http://localhost/'),
        'redirect skipped for localhost:3000': verifyNext(
          'http://localhost:3000/'),
        'redirect skipped for 127.0.0.1': verifyNext(
          'http://127.0.0.1/'),
        'redirect skipped for 127.0.0.1:3000': verifyNext(
          'http://127.0.0.1:3000/')
    },
    'Redirect from most subdomains to a single domain, except one' : {
        topic : function(){
            return factory.redirectHost({
                except:'cdn.example.com',
                to:'www.example.com'
            });
        },
        'middleware exists': function(middleware){
            assert.equal('function', typeof middleware);
        },
        'redirects from example.com to www.example.com': verifyRedirect(
            'http://example.com/',
            '//www.example.com/'),
        'redirects from anything.example.com to www.example.com': verifyRedirect(
            'http://anything.example.com/',
            '//www.example.com/'),
        'redirects from origin.example.com to www.example.com': verifyRedirect(
            'http://origin.example.com/',
            '//www.example.com/'),
        'redirect avoided on www.example.com': verifyNext(
            'http://www.example.com'),
        'redirect avoided on www.example.com:80': verifyNext(
            'http://www.example.com:80'),
        'redirect avoided on cdn.example.com': verifyNext(
            'http://cdn.example.com'),
        'redirect skipped for localhost': verifyNext(
            'http://localhost/'),
        'redirect skipped for localhost:3000': verifyNext(
            'http://localhost:3000/'),
        'redirect skipped for 127.0.0.1': verifyNext(
            'http://127.0.0.1/'),
        'redirect skipped for 127.0.0.1:3000': verifyNext(
            'http://127.0.0.1:3000/')
    },
    'Redirect from most subdomains to a single domain' : {
        topic : function(){
            return factory.redirectHost({
                except:['cdn.example.com', 'origin.example.com'],
                to:'www.example.com'
            });
        },
        'middleware exists': function(middleware){
            assert.equal('function', typeof middleware);
        },
        'redirects from example.com to www.example.com': verifyRedirect(
            'http://example.com/',
            '//www.example.com/'),
        'redirects from anything.example.com to www.example.com': verifyRedirect(
            'http://anything.example.com/',
            '//www.example.com/'),
        'redirect avoided on www.example.com': verifyNext(
            'http://www.example.com'),
        'redirect avoided on www.example.com:80': verifyNext(
            'http://www.example.com:80'),
        'redirect avoided on cdn.example.com': verifyNext(
            'http://cdn.example.com'),
        'redirect avoided on origin.example.com': verifyNext(
            'http://origin.example.com'),
        'redirect skipped for localhost': verifyNext(
            'http://localhost/'),
        'redirect skipped for localhost:3000': verifyNext(
            'http://localhost:3000/'),
        'redirect skipped for 127.0.0.1': verifyNext(
            'http://127.0.0.1/'),
        'redirect skipped for 127.0.0.1:3000': verifyNext(
            'http://127.0.0.1:3000/')
    },
    'Redirect from one domain to another with a specific path' : {
        topic : function(){
            return factory.redirectHost({
                changePath: {
                    'www.example.co.uk': '/uk',
                    'www.example.ca': function(host, url){return '/ca' + url;}
                },
                except:['cdn.example.com', 'origin.example.com'],
                to:'www.example.com'
            });
        },
        'middleware exists': function(middleware){
            assert.equal('function', typeof middleware);
        },
        'redirects from example.com to www.example.com': verifyRedirect(
            'http://example.com/',
            '//www.example.com/'),
        'redirects from anything.example.com to www.example.com': verifyRedirect(
            'http://anything.example.com/',
            '//www.example.com/'),
        'redirect from www.example.co.uk to www.example.com/uk using static path': verifyRedirect(
            'http://www.example.co.uk/',
            '//www.example.com/uk'),
        'redirect from www.example.ca/hello to www.example.com/ca/hello using path function': verifyRedirect(
            'http://www.example.ca/hello',
            '//www.example.com/ca/hello'),
        'redirect avoided on www.example.com': verifyNext(
            'http://www.example.com'),
        'redirect avoided on www.example.com:80': verifyNext(
            'http://www.example.com:80'),
        'redirect avoided on cdn.example.com': verifyNext(
            'http://cdn.example.com'),
        'redirect avoided on origin.example.com': verifyNext(
            'http://origin.example.com'),
        'redirect skipped for localhost': verifyNext(
            'http://localhost/'),
        'redirect skipped for localhost:3000': verifyNext(
            'http://localhost:3000/'),
        'redirect skipped for 127.0.0.1': verifyNext(
            'http://127.0.0.1/'),
        'redirect skipped for 127.0.0.1:3000': verifyNext(
            'http://127.0.0.1:3000/')
    }
}).export(module);
