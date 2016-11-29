# aws-api-lambda-boilerplate

> This boilerplate is an example project to deploy full stack ([AWS Lambda](http://aws.amazon.com/lambda/), [AWS API Gateway](http://aws.amazon.com/api-gateway/)) to [AWS S3](http://aws.amazon.com/s3/).

## Getting Started

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

## Install

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

### Install dependencies

```shell
npm install
```

#### Change parameters in config/default, config/dev, config/prod

### Set aws credential in project
- Copy credentials.local.json to credentials.json
- Set ACCESS_KEY_ID and SECRET_ACCESS_KEY

### Create stack

Install project localy, deploy lambdas and set API with swagger.json to AWS.  

```shell
grunt install
```

## Usage Grunt Commands

### Run jshint

```shell
grunt
```

### Create or update local source directory based on swagger.json 

```shell
grunt swagger_to_lambda
```

### Create lambdas, if does not exist on AWS

```shell
grunt create_lambdas
```

### Create api from swagger.json file, if does not exist on AWS

```shell
grunt create_api
```

### Create api from swagger.json file on AWS

```shell
grunt update_api
```

### Install the full stack (lambdas, api, s3,...) to AWS

```shell
grunt install
```

### Invoke lambda locally

```shell
grunt run
```

#### Options
target: `String`

Usage: `grunt run --target=usersGet`  

### Package all lambdas locally

```shell
grunt package
```

#### Options
target: `String`

Usage: `grunt package --target=usersGet`  

### Upload packages lambdas to AWS s3

```shell
grunt upload
```

#### Options
target: `String`

Usage: `grunt upload --target=usersGet`  

### Package, upload and update lambdas to AWS

```shell
grunt deploy
```

#### Options
target: `String`

Usage: `grunt deploy --target=usersGet`  

### Test lambda localy

```shell
grunt test
```

#### Options
target: `String`

Usage: `grunt test --target=usersGet`  

