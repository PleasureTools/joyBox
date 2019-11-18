const fs = require('fs');

module.exports = {
    devServer: {
        host: 'dev.lan',
        https: {
            key: fs.readFileSync('./data/server.key'),
            cert: fs.readFileSync('./data/server.cer')
        },
    },
};