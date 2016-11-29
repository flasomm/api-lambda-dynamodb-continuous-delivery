/**
 * @author Fabrice Sommavilla <fs@physalix.com>.
 * @date 20/11/2016
 */
'use strict';

var config = require('config');
var fs = require('fs');
var path = require('path');
var Promise = require("bluebird");
var _ = require('lodash');

/**
 * Extract all resources, methods and params from swagger file.
 */
function extractSwaggerFunction() {
    return new Promise(function (resolve, reject) {
        let swaggerPath = path.join(__dirname, '..', 'config', 'swagger.json');
        let swagger = fs.readFileSync(swaggerPath, 'utf8');
        let swaggerObject = JSON.parse(swagger);
        let result = [];

        _.forEach(swaggerObject.paths, function (pathObj, path) {
            // Only process a path if it's an object
            if (!_.isPlainObject(pathObj)) {
                reject('error');
            }
            _.forIn(pathObj, function (value, method) {
                var operation = pathObj[method];

                if (_.isUndefined(operation)) {
                    // Operation does not exist
                    reject('undefined');
                } else if (!_.isPlainObject(operation)) {
                    reject('The %s operation for %s path is not an Operation Object', method, path);
                }

                let resource = path.split("/")[1];
                let macthParam = /^\{(.*)\}$/g.exec(path.split("/")[2]);
                let params = _.isNull(macthParam) || _.isEqual('put', method) ? null : macthParam[1];

                result.push({"resource": resource, "method": method, "params": params});
            });
        });

        resolve(result);
    });
}

/**
 * Update package.json file function name.
 *
 * @param file
 * @param name
 */
function updatePackageFile(file, name) {
    return new Promise(function (resolve) {
        let content = fs.readFileSync(file, 'utf8');
        let packageObj = JSON.parse(content);
        packageObj.name = config.get('projectName') + '-resources-' + name;

        resolve(JSON.stringify(packageObj));
    });
}

/**
 * Create lambda directories with sources.
 *
 * @param files
 */
function createLambdaSource(files) {
    _.forEach(files, function (obj) {
        let ressourceDir = path.join(__dirname, '..', 'src', 'resources', obj.resource + '/');
        let methodName = _.isNil(obj.params) ? obj.method : obj.method + '-by-' + obj.params;
        let methodDir = ressourceDir + methodName + '/';

        fs.access(ressourceDir, fs.F_OK, function (err) {
            if (err) {
                fs.mkdir(ressourceDir, function (e) {
                });
            }
        });

        let tmplDir = path.join(__dirname, '..', 'src', 'template/');
        let lambdaFile = 'index.js';
        let eventFile = 'event.json';
        let pkgFile = 'package.json';

        fs.access(methodDir, fs.F_OK, function (err) {
            if (err) {
                fs.mkdir(methodDir, function (e) {
                    fs.writeFile(
                        methodDir + lambdaFile,
                        fs.readFileSync(tmplDir + 'index.js', 'utf8'),
                        function (e) {
                            if (e) {
                                console.error(e);
                            }
                        });

                    fs.writeFile(
                        methodDir + eventFile,
                        fs.readFileSync(tmplDir + eventFile, 'utf8'),
                        function (e) {
                            if (e) {
                                console.error(e);
                            }
                        });

                    updatePackageFile(tmplDir + pkgFile, obj.resource + '-' + methodName).then(function (res) {
                        fs.writeFile(methodDir + pkgFile, res, function (e) {
                            if (e) {
                                console.error(e);
                            }
                        });
                    });
                });
            }
        });

    });
}

extractSwaggerFunction().then(function (files) {
    createLambdaSource(files);

}).error(function (e) {
    console.log(e);
});
