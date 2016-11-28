/**
 * @author Fabrice Sommavilla <fs@physalix.com>.
 * @date 28/11/2016
 */
'use strict';

var config = require('config');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var AWS = require('aws-sdk');
var apigateway = new AWS.APIGateway(
    {
        apiVersion: "2015-07-09",
        region: config.get('aws.region')
    });

function apiInfos() {
    return new Promise(function (resolve, reject) {
        apigateway.getRestApis({limit: 5}, function (err, data) {
            if (err) {
                reject(err);
            }
            data.items.forEach(function (api) {
                if (_.isEqual(config.get('aws.apiName'), api.name)) {
                    resolve(api);
                }
            });
            reject({"code": "NoSuchEntity"});
        });
    });
}

apiInfos().then(function (data) {
    let apiName = config.get('aws.apiName');
    let swaggerPath = path.join(__dirname, '..', 'config', 'swagger.json');
    let swagger = fs.readFileSync(swaggerPath, 'utf8');
    let swaggerObject = JSON.parse(swagger);
    swaggerObject.info.title = apiName;

    let params = {
        body: JSON.stringify(swaggerObject),
        restApiId: data.id,
        failOnWarnings: true
    };
    console.log("Updating rest api: ", apiName);

    apigateway.putRestApi(params, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    });
}).catch(function (e) {
    console.log(e);
});
