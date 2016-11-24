/**
 * Created by flasomm on 20/11/2016.
 */
'use strict';

var AWS = require('aws-sdk');
var config = require('config');
var fs = require('fs');
var path = require('path');
var rmdir = require('rimraf');
var exec = require('child_process').exec;
var Promise = require("bluebird");
var _ = require('lodash');
var sprintf = require("sprintf-js").sprintf;
var iam = new AWS.IAM({apiVersion: '2010-05-08'});
var s3 = new AWS.S3();
var apigateway = new AWS.APIGateway(
    {
        apiVersion: "2015-07-09",
        region: config.get('aws.region')
    });


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
            console.log('User already exist');
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
            console.log('Group already exist');
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
            console.log('Role already exist');
            resolve(res);

        }).catch(function (e) {
            if (!_.isNil(e.code) && _.isEqual('NoSuchEntity', e.code)) {
                console.log("Create ROLE: ", roleName);

                let policiesPath = path.join(__dirname, '..', 'config', 'policies', 'rolePolicyDocument.json');
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

            let policiesPath = path.join(__dirname, '..', 'config', 'policies', filename);
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

function attachUserGroupRole() {
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
        console.log('Error: ', e);
    });
}

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

function createRestApi() {
    return new Promise(function (resolve, reject) {
        apiInfos().then(function (data) {
            resolve(data);

        }).catch(function (e) {
            if (!_.isNil(e.code) && _.isEqual('NoSuchEntity', e.code)) {
                let apiName = config.get('aws.apiName');
                let swaggerPath = path.join(__dirname, '..', 'config', 'swagger.json');
                let swagger = fs.readFileSync(swaggerPath, 'utf8');
                let swaggerObject = JSON.parse(swagger);
                swaggerObject.info.title = apiName;

                let params = {
                    body: JSON.stringify(swaggerObject),
                    failOnWarnings: true
                };
                console.log("Create REST API: ", apiName);

                apigateway.importRestApi(params, function (err, data) {
                    if (err) {
                        reject(err);
                    } else {
                        reject(data);
                    }
                });
            }
        });
    });
}

function createS3Bucket() {
    return new Promise(function (resolve, reject) {
        let params = {
            Bucket: config.get('aws.s3BucketName'),
            ACL: 'private',
            CreateBucketConfiguration: {
                LocationConstraint: config.get('aws.region')
            }
        };
        s3.createBucket(params, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function parseSwaggerFunction() {
    return new Promise(function (resolve, reject) {
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

function createLambdaSource() {
    return new Promise(function (resolve, reject) {
        parseSwaggerFunction().then(function (res) {
            let sampleLambdaPath = path.join(__dirname, '..', 'src', 'lambda', 'sample.js');
            let lambdaCode = fs.readFileSync(sampleLambdaPath, 'utf8');

            _.forEach(res, function (val) {
                let lambdaPath = path.join(__dirname, '..', 'src', 'lambda', val + '.js');

                fs.access(lambdaPath, fs.F_OK, function (err) {
                    if (err) {
                        fs.writeFile(lambdaPath, lambdaCode, function (err) {
                            if (err) {
                                reject(err);
                            }
                            resolve(res);
                        });
                    }
                    resolve(res);
                });
            });
        });
    });
}

function initBuildDir() {
    return new Promise(function (resolve, reject) {
        let buildDir = path.join(__dirname, '..', 'build');

        rmdir(buildDir, function (error) {
            if (!error) {
                fs.mkdir(buildDir, function (e) {
                    if (!e || (e && e.code === 'EEXIST')) {
                        reject(e);
                    }
                });
            }
        });
    });
}

function packageLambda(files) {
    return new Promise(function (resolve, reject) {
        _.forEach(files, function (file) {
            let buildDir = path.join(__dirname, '..', 'build', _.upperFirst(file));
            let lambdaSrcFile = path.join(__dirname, '..', 'src', 'lambda', file + '.js');
            let packageSrcFile = path.join(__dirname, '..', 'package.json');

            try {
                fs.mkdir(buildDir, function (e) {
                    if (!e || (e && e.code === 'EEXIST')) {
                        reject(e);
                    }
                    fs.createReadStream(lambdaSrcFile).pipe(fs.createWriteStream(buildDir + '/' + _.upperFirst(file) + '.js'));
                    fs.createReadStream(packageSrcFile).pipe(fs.createWriteStream(buildDir + '/package.json'));

                    process.chdir(buildDir);
                    console.log('Change to directory: ' + process.cwd());
                    exec('npm install --production', function (error, stdout, stderr) {
                        if (error) {
                            console.log(error);
                            reject(error);
                        }
                        if (stderr) {
                            console.log(stderr);
                        }
                        resolve(stdout);
                    });
                });
            } catch (err) {
                reject(err);
            }
        })
    });
}

function packageLambdas() {
    return new Promise(function (resolve, reject) {
        createLambdaSource().then(function (files) {
            initBuildDir().catch(function (e) {
                reject(e);
            }).then(function () {
                packageLambda(files).then(function (res) {
                    resolve(res);
                }).catch(function (e) {
                    reject(e);
                });
            });
        }).catch(function (e) {
            reject(e);
        });
    });
}

//attachUserGroupRole();
//createRestApi();
//createS3Bucket();
packageLambdas();