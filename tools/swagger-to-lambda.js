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
var sprintf = require("sprintf-js").sprintf;

/**
 * Extract all resources, methods and params from swagger file.
 */
function extractSwaggerFunction() {
    return new Promise(function (resolve) {
        let swaggerPath = path.join(__dirname, '..', 'config', 'swagger.json');
        let swagger = fs.readFileSync(swaggerPath, 'utf8');
        let swaggerObject = JSON.parse(swagger);
        let result = [];
        _.forIn(swaggerObject.paths, function (value, key) {
            _.forIn(value, function (value, method) {
                let match = /\/(.*)/g.exec(key);
                let matchWithParam = /\/(.*)\/\{(.*)\}/g.exec(key);
                let resource = _.isNull(matchWithParam) ? match[1] : matchWithParam[1];
                let params = _.isNull(matchWithParam) || _.isEqual('put', method) ? '' : sprintf("By%s", _.upperFirst(matchWithParam[2]));
                result.push(sprintf("%s%s%s", _.upperFirst(resource), _.upperFirst(method), params));
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
        packageObj.name = _.kebabCase(name);

        resolve(JSON.stringify(packageObj));
    });
}

/**
 * Create lambda directories with sources.
 *
 * @param files
 */
function createLambdaSource(files) {
    let tmplDir = path.join(__dirname, '..', 'src', 'template/');
    let lambdaFile = 'index.js';
    let eventFile = 'event.json';
    let pkgFile = 'package.json';

    _.forEach(files, function (val) {
        let lambdaDir = path.join(__dirname, '..', 'src', val + '/');
        fs.access(lambdaDir, fs.F_OK, function (err) {
            if (err) {
                fs.mkdir(lambdaDir, function (e) {
                    if (!e || (e && e.code === 'EEXIST')) {
                        fs.writeFile(
                            lambdaDir + lambdaFile,
                            fs.readFileSync(tmplDir + 'index.js', 'utf8'),
                            function (e) {
                                if (e) {
                                    console.error(e);
                                }
                            });

                        fs.writeFile(
                            lambdaDir + eventFile,
                            fs.readFileSync(tmplDir + eventFile, 'utf8'),
                            function (e) {
                                if (e) {
                                    console.error(e);
                                }
                            });

                        updatePackageFile(tmplDir + pkgFile, val).then(function (res) {
                            fs.writeFile(lambdaDir + pkgFile, res, function (e) {
                                if (e) {
                                    console.error(e);
                                }
                            });
                        });
                    }
                });
            }
        });
    });
}

extractSwaggerFunction().then(function (files) {
    createLambdaSource(files);
});
