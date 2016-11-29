module.exports = function (grunt) {

    grunt.initConfig({
        aws: grunt.file.readJSON('config/credentials.json'),
        config: grunt.file.readJSON('config/default.json'),
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
            options: {
                jshintrc: true
            }
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        },
        clean: ['dist'],
        execute: {
            swagger_to_lambda: {
                src: ['tools/swagger-to-lambda.js']
            },
            create_lambdas: {
                src: ['tools/create-lambdas.js']
            },
            create_api: {
                src: ['tools/create-api.js']
            },
            update_api: {
                src: ['tools/update-api.js']
            }
        },
        aws_s3: {
            options: {
                accessKeyId: '<%= aws.accessKeyId %>',
                secretAccessKey: '<%= aws.secretAccessKey %>',
                region: '<%= config.aws.region %>',
                uploadConcurrency: 5, // 5 simultaneous uploads
                downloadConcurrency: 5 // 5 simultaneous downloads
            },
            staging: {
                options: {
                    bucket: '<%= config.aws.s3BucketName %>',
                    access: 'private',
                    differential: true, // Only uploads the files that have changed
                    gzipRename: 'ext' // when uploading a gz file, keep the original extension
                },
                files: [
                    {expand: true, cwd: 'dist/', src: ['*.zip'], dest: '/'}
                ]
            }
        },
        lambda_invoke: {
            usersGet: {
                options: {
                    file_name: "src/resources/users/get/index.js",
                    event: "src/resources/users/get/event.json"
                }
            },
            usersGetByUid: {
                options: {
                    file_name: "src/resources/users/get-by-uid/index.js",
                    event: "src/resources/users/get-by-uid/event.json"
                }
            },
            usersPost: {
                options: {
                    file_name: "src/resources/users/post/index.js",
                    event: "src/resources/users/post/event.json"
                }
            },
            usersPut: {
                options: {
                    file_name: "src/resources/users/put/index.js",
                    event: "src/resources/users/put/event.json"
                }
            }
        },
        lambda_package: {
            usersGet: {
                options: {
                    package_folder: "./src/resources/users/get",
                    include_time: false,
                    include_version: false
                }
            },
            usersGetByUid: {
                options: {
                    package_folder: "./src/resources/users/get-by-uid",
                    include_time: false,
                    include_version: false
                }
            },
            usersPost: {
                options: {
                    package_folder: "./src/resources/users/post",
                    include_time: false,
                    include_version: false
                }
            },
            usersPut: {
                options: {
                    package_folder: "./src/resources/users/put",
                    include_time: false,
                    include_version: false
                }
            }
        },
        lambda_deploy: {
            usersGet: {
                arn: 'arn:aws:lambda:<%= config.aws.region %>:<%= config.aws.accountId %>:function:<%= config.projectName %>-resources-users-get',
                package: "<%= config.projectName %>-resources-users-get_latest",
                options: {
                    aliases: "beta",
                    enableVersioning: true,
                    region: '<%= config.aws.region %>',
                    accessKeyId: '<%= aws.accessKeyId %>',
                    secretAccessKey: '<%= aws.secretAccessKey %>',
                    RoleArn: '<%= config.aws.roleName %>'
                }
            },
            usersGetByUid: {
                arn: 'arn:aws:lambda:<%= config.aws.region %>:<%= config.aws.accountId %>:function:<%= config.projectName %>-resources-users-get-by-uid',
                package: "<%= config.projectName %>-resources-users-get-by-uid_latest",
                options: {
                    aliases: "beta",
                    enableVersioning: true,
                    region: '<%= config.aws.region %>',
                    accessKeyId: '<%= aws.accessKeyId %>',
                    secretAccessKey: '<%= aws.secretAccessKey %>',
                    RoleArn: '<%= config.aws.roleName %>'
                }
            },
            usersPost: {
                arn: 'arn:aws:lambda:<%= config.aws.region %>:<%= config.aws.accountId %>:function:<%= config.projectName %>-resources-users-post',
                package: "<%= config.projectName %>-resources-users-post_latest",
                options: {
                    aliases: "beta",
                    enableVersioning: true,
                    region: '<%= config.aws.region %>',
                    accessKeyId: '<%= aws.accessKeyId %>',
                    secretAccessKey: '<%= aws.secretAccessKey %>',
                    RoleArn: '<%= config.aws.roleName %>'
                }
            },
            usersPut: {
                arn: 'arn:aws:lambda:<%= config.aws.region %>:<%= config.aws.accountId %>:function:<%= config.projectName %>-resources-users-put',
                package: "<%= config.projectName %>-resources-users-put_latest",
                options: {
                    aliases: "beta",
                    enableVersioning: true,
                    region: '<%= config.aws.region %>',
                    accessKeyId: '<%= aws.accessKeyId %>',
                    secretAccessKey: '<%= aws.secretAccessKey %>',
                    RoleArn: '<%= config.aws.roleName %>'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-aws-lambda');
    grunt.loadNpmTasks('grunt-aws-s3');
    grunt.loadNpmTasks('grunt-execute');

    grunt.registerTask('default', ['jshint']);
    grunt.registerTask('swagger_to_lambda', ['jshint', 'execute:swagger_to_lambda']);
    grunt.registerTask('create_lambdas', ['jshint', 'execute:create_lambdas']); // create all lambdas functions on aws
    grunt.registerTask('create_api', ['jshint', 'execute:create_api']); // create api on aws
    grunt.registerTask('update_api', ['jshint', 'execute:update_api']);
    grunt.registerTask('install', ['jshint', 'execute:swagger_to_lambda', 'clean', 'lambda_package', 'aws_s3:staging', 'execute:create_lambdas', 'execute:create_api']);

    grunt.registerTask('run', ['jshint', 'lambda_invoke']); // grunt run:default (run default lambda) or grunt run (all lambdas)
    grunt.registerTask('package', ['jshint', 'clean', 'lambda_package']); // create lambdas package
    grunt.registerTask('upload', ['jshint', 'clean', 'lambda_package', 'aws_s3:staging']); // create lambdas package and upload to s3
    grunt.registerTask('deploy', ['jshint', 'clean', 'lambda_package', 'aws_s3:staging', 'lambda_deploy']);

    // Update only userGet lambda
    // grunt jshint clean lambda_package:usersGet aws_s3:staging lambda_deploy:usersGet
};