# api-lambda-dynamodb-continuous-delivery

> SmartServices project.

## Coding rules

### Directory structure
```
-package.json
-Gruntfile.js
-README.md
-tools/
  |__create-api.js
  |__create-identity.js
  |__create-lambdas.js
  |__swagger-to-lambda.js
  |__update-api.js
 -config/
  |__credentials.local.json
  |__default.json
  |__dev.json
  |__prod.json
  |__swagger.json
-dist/
  |__resources-users-get-by-uid.zip
  |__...
-src/
  |__resources/
  |____users/
  |______get/
  |________index.js
  |________package.json
  |________event.json
  |________node_modules    
  |______get-by-uid/
  |______put/
  |______post/
```


## Getting Started

### Install aws cli

```shell
sudo pip install awscli
```

### Configure aws credentials

```shell
aws configure
```

Enter ACCESS_KEY_ID, SECRET_ACCESS_KEY and REGION.

### Clone the project from CodeCommit

```shell
git clone smse-ac
```

### Set aws credential in project
- Copy credentials.local.json to credentials.json
- Set ACCESS_KEY_ID and SECRET_ACCESS_KEY

### Create stack

Install project localy, deploy lambdas and set API with swagger.json to AWS.  

```shell
grunt install
```

Deploy a lambda to AWS

```shell
grunt deploy <method>
```
Ex: grunt deploy users-get

Test lambda localy

```shell
grunt test <method> (ex: users-get)
```
Ex: grunt test users-get
