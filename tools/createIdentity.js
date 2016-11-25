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
var sprintf = require("sprintf-js").sprintf;
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

        userInfos(config.get('aws.userName')).then(function (res) {
            console.log('USER already exist');
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
            console.log('GROUP already exist');
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
            console.log('ROLE already exist');
            resolve(res);

        }).catch(function (e) {
            if (!_.isNil(e.code) && _.isEqual('NoSuchEntity', e.code)) {
                let policiesPath = path.join(__dirname, '..', 'config', 'policies', 'rolePolicyDocument.json');
                let policies = fs.readFileSync(policiesPath, 'utf8');
                let params = {
                    AssumeRolePolicyDocument: policies,
                    RoleName: roleName
                };
                console.log("Create ROLE: ", roleName);

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
            PolicyArn: sprintf('arn:aws:iam::%s:policy/%s', config.get('aws.accountId'), policy)
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
            let policiesPath = path.join(__dirname, '..', 'config', 'policies', filename);
            let policies = fs.readFileSync(policiesPath, 'utf8');
            let params = {
                PolicyDocument: policies,
                PolicyName: policyName,
                Description: description
            };
            console.log("Create policies:", policyName);

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

        createPolicy(
            groupPolicyName,
            'groupPolicies.json',
            'Project group policies'
        ).then(function (res) {
            let groupName = config.get('aws.groupName');
            let params = {
                GroupName: groupName,
                PolicyArn: res.Policy.Arn
            };
            console.log("Attach policies %s to GROUP : %s", groupName, groupPolicyName);

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

function attachRolePolicy() {
    return new Promise(function (resolve, reject) {
        let rolePolicyName = config.get('aws.rolePolicyName');

        createPolicy(
            rolePolicyName,
            'rolePolicies.json',
            'Project role policies'
        ).then(function (res) {
            let roleName = config.get('aws.roleName');
            let params = {
                RoleName: roleName,
                PolicyArn: res.Policy.Arn
            };
            console.log("Attach policies %s to ROLE : %s", roleName, rolePolicyName);

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

function createUserGroupRole() {
    Promise.all([
        createUser(),
        createRole(),
        createGroup(),
        attachGroupPolicy(),
        attachRolePolicy()]
    ).then(function (res) {

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
    }).catch(function (e) {
        console.error(e);
    });
}

createUserGroupRole();