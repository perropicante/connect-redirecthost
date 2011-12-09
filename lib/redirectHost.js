/*!
 * connect-redirecthost
 *
 * Copyright(c) 2011 M Gradek
 * MIT Licensed
 */
var _ = require('underscore');

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
 * @param {String || Object} options
 * @return {Function} middleware function(req, res, next)
 *
 */

exports.redirectHost = function(options){
    if(!options){
        throw new ReferenceError('options is required, specify at least a hostname');
    }

    // Handle case with a single redirect target domain for all domains
    if(typeof options === 'string'){
        var acceptable = options;

        return function(req, res, next){
            var host = req.header('host');
            var url = req.url;

            if(host === acceptable || host === 'localhost'){
                next();
            }else{
                res.redirect('http://' + acceptable + url);
            }
        }
    }

    // Handle case with a white-list of domains that do not get redirected
    var target = options.to;
    var except = {};
    except[target] = true;
    except['localhost'] = true;

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

    return function(req, res, next){
        var host = req.header('host');
        var url = req.url;

        if(host in except){
            next();
        }else{
            res.redirect('http://' + target + url);
        }
    };
}