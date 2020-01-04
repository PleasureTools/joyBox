const fs = require('fs');

const devServerConfig = () => process.env.NODE_ENV === 'production' ?
    {} :
    {
        host: 'dev.lan',
        https: {
            key: fs.readFileSync('./data/server.key'),
            cert: fs.readFileSync('./data/server.cer')
        },
    };

module.exports = {
    devServer: devServerConfig(),
    chainWebpack: config => {
        config.module
            .rule('vue')
            .use('vue-loader')
            .loader('vue-loader')
            .tap(options => ({ transformAssetUrls: { 'v-img': 'src' } }));
    }
};