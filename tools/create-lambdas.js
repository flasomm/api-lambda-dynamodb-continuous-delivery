/**
 * Created by Fabrice Sommavilla on 26/11/2016.
 */
'use strict';

var config = require('config');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var sprintf = require("sprintf-js").sprintf;
var AWS = require('aws-sdk');
var lambda = new AWS.Lambda({
    apiVersion: '2015-03-31',
    region: config.get('aws.region')
});

let distDir = path.join(__dirname, '..', 'dist/');

fs.access(distDir, fs.F_OK, function (err) {
    if (!err) {
        fs.readdir(distDir, (err, files) => {
            files.forEach(file => {
                let fnName = file.substring(0, file.lastIndexOf('.') - 7);
                var params = {
                    Code: {
                        S3Bucket: config.get('aws.s3BucketName'),
                        S3Key: file
                    },
                    FunctionName: fnName,
                    Handler: sprintf('index.handler'),
                    Role: sprintf('arn:aws:iam::%s:role/%s', config.get('aws.accountId'), config.get('aws.roleName')),
                    Runtime: 'nodejs4.3',
                    Description: sprintf('Function %s', fnName)
                };
                lambda.createFunction(params, function (err, data) {
                    if (err) {
                        console.log(err, err.stack);
                    } else {
                        console.log('Creating lambda function ', data.FunctionArn);
                    }
                });
            });
        });
    }
});
