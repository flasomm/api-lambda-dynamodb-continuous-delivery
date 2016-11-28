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
            default: {
                options: {
                    file_name: "src/template/index.js",
                    event: "src/template/event.json"
                }
            },
            usersGet: {
                options: {
                    file_name: "src/UsersGet/index.js",
                    event: "src/UsersGet/event.json"
                }
            },
            usersGetByUid: {
                options: {
                    file_name: "src/UsersGetByUid/index.js",
                    event: "src/UsersGetByUid/event.json"
                }
            },
            usersPost: {
                options: {
                    file_name: "src/UsersPost/index.js",
                    event: "src/UsersPost/event.json"
                }
            },
            usersPut: {
                options: {
                    file_name: "src/UsersPut/index.js",
                    event: "src/UsersPut/event.json"
                }
            }
        },
        lambda_package: {
            default: {
                options: {
                    package_folder: "./src/template",
                    include_time: false,
                    include_version: false
                }
            },
            usersGet: {
                options: {
                    package_folder: "./src/UsersGet",
                    include_time: false,
                    include_version: false
                }
            },
            usersGetByUid: {
                options: {
                    package_folder: "./src/UsersGetByUid",
                    include_time: false,
                    include_version: false
                }
            },
            usersPost: {
                options: {
                    package_folder: "./src/UsersPost",
                    include_time: false,
                    include_version: false
                }
            },
            usersPut: {
                options: {
                    package_folder: "./src/UsersPut",
                    include_time: false,
                    include_version: false
                }
            }
        },
        lambda_deploy: {
            default: {
                arn: 'arn:aws:lambda:<%= config.aws.region %>:<%= config.aws.accountId %>:function:template',
                package: "template",
                options: {
                    aliases: "beta",
                    enableVersioning: true,
                    region: '<%= config.aws.region %>',
                    accessKeyId: '<%= aws.accessKeyId %>',
                    secretAccessKey: '<%= aws.secretAccessKey %>'
                }
            },
            usersGet: {
                arn: 'arn:aws:lambda:<%= config.aws.region %>:<%= config.aws.accountId %>:function:UsersGet',
                package: "users-get_latest",
                options: {
                    aliases: "beta",
                    enableVersioning: true,
                    region: '<%= config.aws.region %>',
                    accessKeyId: '<%= aws.accessKeyId %>',
                    secretAccessKey: '<%= aws.secretAccessKey %>'
                }
            },
            usersGetByUid: {
                arn: 'arn:aws:lambda:<%= config.aws.region %>:<%= config.aws.accountId %>:function:UsersGetByUid',
                package: "users-get-by-uid_latest",
                options: {
                    aliases: "beta",
                    enableVersioning: true,
                    region: '<%= config.aws.region %>',
                    accessKeyId: '<%= aws.accessKeyId %>',
                    secretAccessKey: '<%= aws.secretAccessKey %>'
                }
            },
            usersPost: {
                arn: 'arn:aws:lambda:<%= config.aws.region %>:<%= config.aws.accountId %>:function:UsersPost',
                package: "users-post_latest",
                options: {
                    aliases: "beta",
                    enableVersioning: true,
                    region: '<%= config.aws.region %>',
                    accessKeyId: '<%= aws.accessKeyId %>',
                    secretAccessKey: '<%= aws.secretAccessKey %>'
                }
            },
            usersPut: {
                arn: 'arn:aws:lambda:<%= config.aws.region %>:<%= config.aws.accountId %>:function:UsersPut',
                package: "users-put_latest",
                options: {
                    aliases: "beta",
                    enableVersioning: true,
                    region: '<%= config.aws.region %>',
                    accessKeyId: '<%= aws.accessKeyId %>',
                    secretAccessKey: '<%= aws.secretAccessKey %>'
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
    grunt.registerTask('create_stack', ['jshint', 'execute:swagger_to_lambda', 'clean', 'lambda_package', 'aws_s3:staging', 'execute:create_lambdas']);

    grunt.registerTask('run', ['jshint', 'lambda_invoke']); // grunt run:default (run default lambda) or grunt run (all lambdas)
    grunt.registerTask('package', ['jshint', 'clean', 'lambda_package']); // create lambdas package
    grunt.registerTask('upload', ['jshint', 'clean', 'lambda_package', 'aws_s3:staging']); // create lambdas package and upload to s3
    grunt.registerTask('deploy', ['jshint', 'clean', 'lambda_package', 'aws_s3:staging', 'lambda_deploy']);
};