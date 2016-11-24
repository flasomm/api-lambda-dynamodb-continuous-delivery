/**
 * Created by flasomm on 20/11/2016.
 */
'use strict';

var config = require('config');
var AWS = require('aws-sdk');
var fs = require('fs');
var path = require('path');
var apigateway = new AWS.APIGateway(
    {
        apiVersion: "2015-07-09",
        region: config.get('aws.region')
    });

var swaggerPath = path.join(__dirname, '..', 'swagger.json');

fs.readFile(swaggerPath, 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }
    /*var params = {
     limit: 1
     };
     apigateway.getRestApis(params, function (err, data) {
     if (err) {
     console.log(err, err.stack);
     } else {
     console.log(data);
     }
     });*/

    /*var params = {
     restApiId: 'STRING_VALUE'
     };
     apigateway.deleteRestApi(params, function (err, data) {
     if (err) {
     console.log(err, err.stack);
     } else {
     console.log(data);
     }
     });*/

    var params = {
        body: data,
        failOnWarnings: true
    };
    apigateway.importRestApi(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            console.log(data);
        }
    });
});