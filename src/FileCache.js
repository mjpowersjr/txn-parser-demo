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
        const serialized = JSON.stringify(data, null, 2);
        return fs.promises.writeFile(
            this.buildPath(key),
            serialized
        );
    }

    async get(key) {
        const serialized = await fs.promises.readFile(
            this.buildPath(key)
            );
        return JSON.parse(serialized);
    }

    buildPath(key) {
        return path.join(this.dataDirectory, key);
    }
}

module.exports = FileCache;
