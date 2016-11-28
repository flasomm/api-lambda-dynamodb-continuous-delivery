/**
 * @author Fabrice Sommavilla <fs@physalix.com>.
 * @date 26/11/2016
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

let srcDir = path.join(__dirname, '..', 'src');

fs.readdir(srcDir, (err, files) => {
    files.forEach(file => {
        if (!_.isEqual("template", file) || !_.isEqual(".DS_Store", file)) {
            var params = {
                Code: {
                    S3Bucket: config.get('aws.s3BucketName'),
                    S3Key: sprintf('%s_latest.zip', _.kebabCase(file))
                },
                FunctionName: file,
                Handler: sprintf('index.handler'),
                Role: sprintf('arn:aws:iam::%s:role/%s', config.get('aws.accountId'), config.get('aws.roleName')),
                Runtime: 'nodejs4.3',
                Description: sprintf('Function %s', file)
            };
            lambda.createFunction(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                } else {
                    console.log('Creating lambda function ', data.FunctionArn);
                }
            });
        }
    });
});
