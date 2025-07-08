const fs = require("fs");

// For basic development without HTTPS/SSL, use this simpler configuration:
/*
const cfg = {
    urls: {
        local: "http://localhost:8080/widget/"
    },
    webpackDevOptions: {
        devServer: {
            port: 8080,
            host: "localhost"
        }
    }
};
*/

// Current configuration for beta.team environment:
const cfg = {
    urls: {
        // URL to serve from webpack (local)
        local: "https://widgetdev.beta.team:8082/widget/" // Updated port to match devServer

        // URL to access this server (public), default is same as local
        //   you can define different public URL if you serve behind reverse proxy
        //      but public path and local path must be the same (webpack limitation)
        //   in case of S3: public URL must be undef
        // public: "https://widgetdev.beta.team:443/widget/"
    },
    webpackDevOptions: {
        // in this section you can override webpack dev options (base configuration from webpack.config.dev.js)
        // please refer to https://webpack.js.org/configuration/ for global webpack configuration
        // please refer to https://webpack.js.org/configuration/dev-server/ for devServer

        devServer: {
            server: {
                type: "https",
                // uncomment these lines if you want to serve https
                options: {
                    key: fs.readFileSync("C:/SSL/beta.team-Wildcard.key"),
                    cert: fs.readFileSync("C:/SSL/beta.team-Wildcard-2025.crt")
                }
            },
            port: 8084, // Changed to avoid port conflicts
            host: "widgetdev.beta.team"
        }
    },
    s3: {
        // This section to configure startS3
        // if you use startS3, urls.public must be undef and you must enable https
        options: {
            // aws sdk will use default profile if no accessKeyId & secretAccessKey are provided (files are undefined)
            accessKeyId: "your_AWS_AccessKeyId",
            secretAccessKey: "your_AWS_SecretAccessKey",
            region: "your_AWS_S3_bucket_region"

            // uncomment if you want to prevent static files to always resync
            // autoSyncIgnoreRegexp: /.*static\/(images|fonts|lib).*/
        },
        params: {
            Bucket: "your_bucket_name",
            ACL: "public-read",
            // distant path ;file path & name will be concatenated to the Key parameter
            Key: "path/inside/bucket"
        },
        // will compress js files using gzip
        useCompression: true
    },
    devVariables: {
        vue: {
            useExternalDebugger: false
        }
    },
    
    // Development/Production Mode Configuration
    appConfig: {
        // Set to false to hide development UI elements for production use
        showDevelopmentHeader: true,
        showDevelopmentTools: true,
        // Environment indicator - set to 'production' to enable production mode
        environment: "development" // 'development' | 'production'
    }
};

module.exports = cfg;
