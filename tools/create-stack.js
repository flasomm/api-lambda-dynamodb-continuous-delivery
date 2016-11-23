/**
 * Created by flasomm on 20/11/2016.
 */
'use strict';

var AWS = require('aws-sdk');
var config = require('config');
var fs = require('fs');
var path = require('path');
var Promise = require("bluebird");
var _ = require('lodash');
var iam = new AWS.IAM({apiVersion: '2010-05-08'});


function userInfos(username) {
    return new Promise(function (resolve, reject) {
        iam.getUser({UserName: username}, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.User);
            }
        });
    });
}

function createUser() {
    return new Promise(function (resolve, reject) {
        let userName = config.get('aws.userName');

        userInfos(userName).then(function (res) {
            console.log('User already exist: \n', res);
            resolve(res);

        }).catch(function (e) {
            if (!_.isNil(e.code) && _.isEqual('NoSuchEntity', e.code)) {
                console.log("Create USER: ", userName);

                iam.createUser({UserName: userName}, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            }
        });
    });
}

function groupInfos(groupName) {
    return new Promise(function (resolve, reject) {
        iam.getGroup({GroupName: groupName}, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Group);
            }
        });
    });
}

function createGroup() {
    return new Promise(function (resolve, reject) {
        let groupName = config.get('aws.groupName');

        groupInfos(groupName).then(function (res) {
            console.log('Group already exist: \n', res);
            resolve(res);

        }).catch(function (e) {
            if (!_.isNil(e.code) && _.isEqual('NoSuchEntity', e.code)) {
                console.log("Create GROUP: ", groupName);

                iam.createGroup({GroupName: groupName}, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            }
        });
    });
}

function roleInfos(roleName) {
    return new Promise(function (resolve, reject) {
        iam.getRole({RoleName: roleName}, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Role);
            }
        });
    });
}

function createRole() {
    return new Promise(function (resolve, reject) {
        let roleName = config.get('aws.roleName');

        roleInfos(roleName).then(function (res) {
            console.log('Role already exist: \n', res);
            resolve(res);

        }).catch(function (e) {
            if (!_.isNil(e.code) && _.isEqual('NoSuchEntity', e.code)) {
                console.log("Create ROLE: ", roleName);

                let policiesPath = path.join(__dirname, '..', 'config', 'rolePolicyDocument.json');
                let policies = fs.readFileSync(policiesPath, 'utf8');
                let params = {
                    AssumeRolePolicyDocument: policies,
                    RoleName: roleName
                };
                iam.createRole(params, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            }
        });
    });
}

function checkPolicy(policy) {
    return new Promise(function (resolve, reject) {
        let params = {
            PolicyArn: 'arn:aws:iam::' + config.get('aws.accessKeyId') + ':policy/' + policy
        };
        iam.getPolicy(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function createPolicy(policyName, filename, description) {
    return new Promise(function (resolve, reject) {

        checkPolicy(policyName).then(function (res) {
            resolve(res);

        }).catch(function (e) {
            console.log("Create policies:", policyName);

            let policiesPath = path.join(__dirname, '..', 'config', filename);
            let policies = fs.readFileSync(policiesPath, 'utf8');
            let params = {
                PolicyDocument: policies,
                PolicyName: policyName,
                Description: description
            };
            iam.createPolicy(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    });
}

function attachGroupPolicy() {
    return new Promise(function (resolve, reject) {
        let groupPolicyName = config.get('aws.groupPolicyName');
        let groupName = config.get('aws.groupName');

        createPolicy(
            groupPolicyName,
            'groupPolicies.json',
            'Project group policies'
        ).then(function (res) {
            console.log("Attach policies %s to GROUP : %s", groupName, groupPolicyName);
            let params = {
                GroupName: groupName,
                PolicyArn: res.Policy.Arn
            };

            iam.attachGroupPolicy(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }).catch(function (err) {
            reject(err);
        });
    });
}

function checkGroupPolicy(policy) {
    return new Promise(function (resolve, reject) {
        let params = {
            GroupName: config.get('aws.group'),
            PolicyName: policy
        };
        iam.getGroupPolicy(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data.Group);
            }
        });
    });
}

function attachUserToGroup() {
    Promise.all([createUser(), createGroup(), attachGroupPolicy()]).then(function (res) {

        return new Promise(function (resolve, reject) {
            let params = {
                GroupName: config.get('aws.groupName'),
                UserName: config.get('aws.userName')
            };
            iam.addUserToGroup(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    });
}

function attachRolePolicy() {
    return new Promise(function (resolve, reject) {
        let rolePolicyName = config.get('aws.rolePolicyName');
        let roleName = config.get('aws.roleName');

        createPolicy(
            rolePolicyName,
            'rolePolicies.json',
            'Project role policies'
        ).then(function (res) {
            console.log("Attach policies %s to ROLE : %s", roleName, rolePolicyName);
            let params = {
                RoleName: roleName,
                PolicyArn: res.Policy.Arn
            };
            iam.attachRolePolicy(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }).catch(function (err) {
            reject(err);
        });
    });
}

//createRole();
attachUserToGroup();
attachRolePolicy();

/*var apigateway = new AWS.APIGateway(
 {
 apiVersion: "2015-07-09",
 region: config.get('aws.region')
 });

 var swaggerPath = path.join(__dirname, '..', 'swagger.json');

 fs.readFile(swaggerPath, 'utf8', function (err, data) {
 if (err) {
 return console.log(err);
 }
 var params = {
 limit: 1
 };
 apigateway.getRestApis(params, function (err, data) {
 if (err) {
 console.log(err, err.stack);
 } else {
 console.log(data);
 }
 });

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
 });*/