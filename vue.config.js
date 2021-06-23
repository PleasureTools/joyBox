const fs = require('fs');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const OfflineMode = require('./plugins/OfflineMode');

const IsProduction = () => process.env.NODE_ENV === 'production';

const devServerConfig = () => IsProduction() ?
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
            '^/upload_video': {
                target: 'https://dev.lan:3000',
                // Have no idea why bypass handled any requests
                bypass: req => req.url.startsWith('/upload_video') && req.method == 'POST' ? null : '/'
            },
        }
    };

module.exports = {
    productionSourceMap: false,
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

        if (IsProduction()) {
            config
                .plugin('offlineMode')
                .use(new OfflineMode('service-worker.js'));
        }
    }
};