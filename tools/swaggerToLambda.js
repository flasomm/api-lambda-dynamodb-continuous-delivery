/**
 * Created by flasomm on 20/11/2016.
 */
'use strict';

var config = require('config');
var fs = require('fs');
var path = require('path');
var Promise = require("bluebird");
var _ = require('lodash');
var sprintf = require("sprintf-js").sprintf;

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
                let params = _.isNull(matchWithParam) || _.isEqual('put', method) ? '' : sprintf("By%s", _.capitalize(matchWithParam[2]));
                result.push(sprintf("%s%s%s", resource, _.capitalize(method), params));
            });
        });
        resolve(result);
    });
}

function createLambdaSource(files) {
    let sampleLambdaPath = path.join(__dirname, '..', 'src', 'lambda', 'lambda-template.js');
    let lambdaCode = fs.readFileSync(sampleLambdaPath, 'utf8');

    _.forEach(files, function (val) {
        let lambdaPath = path.join(__dirname, '..', 'src', 'lambda', val + '.js');
        fs.access(lambdaPath, fs.F_OK, function (err) {
            if (err) {
                fs.writeFile(lambdaPath, lambdaCode, function (e) {
                    if (e) {
                        console.error(e);
                    }
                });
            }
        });
    });
}

function swaggerToLambdas() {
    extractSwaggerFunction().then(function (files) {
        createLambdaSource(files);
    });
}

swaggerToLambdas();