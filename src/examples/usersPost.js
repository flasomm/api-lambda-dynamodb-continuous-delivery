/**
 * Created by flasomm on 24/11/2016.
 */
'use strict';

var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = (event, context, callback) => {
    console.log(JSON.stringify(event, null, '  '));
    dynamodb.listTables(function (err, data) {
        console.log(JSON.stringify(data, null, '  '));
    });
    var tableName = "Users";
    dynamodb.putItem({
        "TableName": tableName,
        "Item": {
            "email": {"S": event.email},
            "telephone": {"S": event.telephone}
        }
    }, function (err, data) {
        if (err) {
            callback(null, 'putting item into dynamodb failed: ' + err);
            context.done('error', 'putting item into dynamodb failed: ' + err);
        }
        else {
            console.log('great success: ' + JSON.stringify(data, null, '  '));
            callback(null, 'Successfully created items.');
            context.done('K THX BY');
        }
    });
};
