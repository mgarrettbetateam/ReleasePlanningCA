const devConf = require("@widget-lab/widget-templates-webpack-configs/webpack.config.dev");
const devS3Conf = require("@widget-lab/widget-templates-webpack-configs/webpack.config.dev-s3");
const prod = require("@widget-lab/widget-templates-webpack-configs/webpack.config.prod");

const VueLoaderPlugin = require("vue-loader/lib/plugin");
const { VuetifyLoaderPlugin } = require("vuetify-loader");
const { WindowsPermissionFixPlugin } = require("./src/utils/WindowsPermissionFix");

const { merge } = require("webpack-merge");
const path = require("path");
const fs = require("fs");

// Ensure directories exist before webpack starts
function ensureDirectories() {
    const dirs = ["dist", "dist/static", "dist/static/fonts", "dist/static/images"];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// Call it immediately
ensureDirectories();

const vueConf = {
    module: {
        rules: [{ test: /\.vue$/, loader: "vue-loader" }]
    },
    plugins: [new VueLoaderPlugin()]
};

const vuetifyConf = {
    module: {
        rules: [
            {
                test: /\.(svg|eot|woff|ttf|svg|woff2)$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]",
                            outputPath: "static/fonts"
                        }
                    }
                ]
            },
            {
                test: /\.s(c|a)ss$/,
                use: [
                    "vue-style-loader",
                    "css-loader",
                    {
                        loader: "sass-loader",
                        options: {
                            implementation: require("sass"),
                            sassOptions: {
                                indentedSyntax: true // optional
                            }
                        }
                    }
                ]
            }
        ]
    },
    plugins: [new VuetifyLoaderPlugin()]
};

/**
 * use this object to override our settings
 */
const myConf = {
    resolve: {
        extensions: [".js", ".vue", ".json"],
        alias: {
            "@": path.resolve("src")
        }
    },
    
    // Add Windows permission fix plugin
    plugins: [
        new WindowsPermissionFixPlugin()
    ]
};

module.exports = [
    { name: "dev", ...merge(devConf, vueConf, vuetifyConf, myConf) },
    { name: "devS3", ...merge(devS3Conf, vueConf, vuetifyConf, myConf) },
    { name: "prod", ...merge(prod, vueConf, vuetifyConf, myConf) }
];
