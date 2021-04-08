const path = require('path');
const fs = require('fs');

class FileCache {

    constructor(dataDirectory) {
        this.dataDirectory = dataDirectory;

        // ensure cache directory exists
        if (! fs.existsSync(this.dataDirectory)) {
            fs.mkdirSync(this.dataDirectory);
            console.log(`created ${this.dataDirectory}`);
        }
    }

    async set(key, data) {
        fs.promises.writeFile(
            this.buildPath(key),
            data
        );
    }

    async get(key) {
        return fs.promises.readFile(
            this.buildPath(key)
            );
    }

    buildPath(key) {
        return path.join(this.dataDirectory, key);
    }
}

module.exports = FileCache;
