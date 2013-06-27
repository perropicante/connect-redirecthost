/*!
 * connect-redirecthost
 *
 * Copyright(c) 2011 M Gradek
 * MIT Licensed
 */
var _ = require('underscore'),
    URL = require('url');

/**
 * Setup the redirect middleware
 *
 * The middleware can be setup with a single string argument
 * which will redirect all other domains to the one specified
 * in the argument (except localhost, which is always ignored)
 *
 * `redirectHost('www.example.com');`
 *
 *
 * The middleware can also be setup with an object argument
 * which supports specifying domains which should not be redirected.
 * In such cases, the root relative path is preserved.
 *
 * ```redirectHost({
 *     to: 'www.example.com',
 *     except: 'cdn.example.com'
 * });```
 *
 * ```redirectHost({
 *     to: 'www.example.com',
 *     except: ['cdn.example.com', 'origin.example.com']
 * });```
 *
 *
 * Alternatively, should the root relative path be reset,
 * the following options can be used, where the path will
 * be set to the associated domain's value, or function
 * return value
 *
 * ```redirectHost({
 *     to: 'www.example.com',
 *     changePath: {'www.example.ca': '/ca', 'www.example.us': '/us'}
 * });```
 *
 * ```redirectHost({
 *     to: 'www.example.com',
 *     changePath: {
 *      'www.example.ca': function(host, url){return '/ca' + url;},
 *      'www.example.us': function(host, url){return '/us' + url;}
 *     }
 * });```
 *
 *
 * @param {String || Object} options
 * @return {Function} middleware function(req, res, next)
 *
 */

exports.redirectHost = function(options){
    if(!options){
        throw new ReferenceError('options is required, specify at least a hostname');
    }

    // Determine if there is anything that must change the paths
    var pathFunc = function(host, url){return url;};
    if(options.changePath){
        pathFunc = function(host, url){
            var override = options.changePath[host];
            if(override){
                if(_.isFunction(override)){
                    return override(host, url);
                }

                return override;
            }

            return url;
        }
    }

    // Localhost is ignored for redirects
    var except = {};
    except['127.0.0.1'] = true;
    except['localhost'] = true;

    // Handle case with a single redirect target domain for all domains
    if(typeof options === 'string'){
        except[options] = true;
        return createHandler(options, except, pathFunc);
    }

    // Handle case with a white-list of domains that do not get redirected
    var to = options.to;
    except[to] = true;

    // Handle single exception specified as a string instead of an array
    if(typeof options.except === "string"){
        except[options.except] = true;
    }else{
        except = _.reduce(
            options.except,
            function(memo, host){
                memo[host] = true;
                return memo;
            },
            except);
    }

    return createHandler(to, except, pathFunc);
}


/**
 * Creates the middleware to handle the redirect
 *
 * @param {String} to
 * @param {Array} except
 * @return {Function} middleware function(req, res, next)
 * @api private
 */

function createHandler(to, except, pathFunc){
    var protocol = URL.parse(to);
    return function(req, res, next){
        var host = (req.header('host') || '').split(':')[0]; // strip port from host
        var url = req.url;

        if(host in except){
            next();
        }else{
            res.redirect((protocol ? '' : 'http://') + to + pathFunc(host, url)); //<- change url based on host
        }
    };
}
