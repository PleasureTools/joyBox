const fs = require('fs');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const devServerConfig = () => process.env.NODE_ENV === 'production' ?
    {} :
    {
        host: 'dev.lan',
        https: {
            key: fs.readFileSync('./data/server.key'),
            cert: fs.readFileSync('./data/server.cer')
        },
        proxy: {
            '^/socket.io': {
                target: 'https://dev.lan:3000',
                ws: true
            },
            '^/archive/+.': {
                target: 'https://dev.lan:3000'
            },
        }
    };

module.exports = {
    configureWebpack: {
        devtool: 'source-map'
    },
    devServer: devServerConfig(),
    chainWebpack: config => {
        config.module
            .rule('vue')
            .use('vue-loader')
            .loader('vue-loader')
            .tap(options => ({ transformAssetUrls: { 'v-img': 'src' } }));
        config.resolve
            .plugin('tscpp')
            .use(TsconfigPathsPlugin);
    }
};