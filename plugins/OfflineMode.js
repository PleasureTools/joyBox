const fs = require('fs');
const util = require('util');
const path = require('path');
const crypto = require('crypto');

module.exports = class OfflineMode {
    swFilename = '';
    swFullPath = '';
    assetsPattern = 'const cachedAssets = [];';
    cacheNamePattern = 'const cacheName = \'\';';

    constructor(swFilename) {
        this.swFilename = swFilename;
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tap('OfflineMode',
            compilation => {
                this.swFullPath = path.join(compilation.options.output.path, this.swFilename);
                this.populateSw(Object.keys(compilation.assets).filter(x => x !== this.swFilename))
            }
        );
    }

    async populateSw(assets) {
        const readFile = util.promisify(fs.readFile);
        const writeFile = util.promisify(fs.writeFile);


        const content = (await readFile(this.swFullPath)).toString()
            .replace(this.assetsPattern, `const cachedAssets = ${JSON.stringify(assets)};`)
            .replace(this.cacheNamePattern, `const cacheName = '${crypto.randomBytes(16).toString('hex')}';`);

        writeFile(this.swFullPath, content);
    }

}