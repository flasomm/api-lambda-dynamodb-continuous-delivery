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
            swaggerToLambda: {
                src: ['tools/swaggerToLambda.js']
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
                    package_folder: "src/template",
                    include_time: false,
                    include_version: false
                }
            },
            usersGet: {
                options: {
                    package_folder: "src/UsersGet",
                    include_time: false,
                    include_version: false
                }
            },
            usersGetByUid: {
                options: {
                    package_folder: "src/UsersGetByUid",
                    include_time: false,
                    include_version: false
                }
            },
            usersPost: {
                options: {
                    package_folder: "src/UsersPost",
                    include_time: false,
                    include_version: false
                }
            },
            usersPut: {
                options: {
                    package_folder: "src/UsersPut",
                    include_time: false,
                    include_version: false
                }
            }
        },
        lambda_deploy: {
            default: {
                arn: 'arn:aws:lambda:<%= config.aws.region %>:<%= config.aws.accountId %>:function:sample',
                package: "template",
                options: {
                    aliases: "beta",
                    enableVersioning: true,
                    region: '<%= aws.region %>',
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
    grunt.registerTask('swaggerToLambda', ['jshint', 'execute:swaggerToLambda']);
    grunt.registerTask('run', ['jshint', 'lambda_invoke']); // grunt run:default (run default lambda) or grunt run (all lambdas)
    grunt.registerTask('package', ['jshint', 'clean', 'lambda_package']); // grunt run:default (run default lambda) or grunt run (all lambdas)
    grunt.registerTask('upload', ['jshint', 'clean', 'lambda_package', 'aws_s3:staging']);
    grunt.registerTask('deploy', ['jshint', 'clean', 'lambda_package', 'lambda_deploy:default']);
};