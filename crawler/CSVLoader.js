const fs = require('fs');
const CSVParser = require('csv');
const Promise = require('bluebird');


class CSVLoader {
    constructor() {}

    extractItems(url) {
        return new Promise((resolve, reject) => {
            fs.readFile(url, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return false;
                }

                this.parse(data, resolve, reject);
            });
        });
    }

    parse(data, resolve, reject) {
        CSVParser.parse(data, (err, data) => {
            if (err) {
                reject(err);
                return false;
            }

            this.transform(data, resolve, reject);
        });
    }

    transform(data, resolve, reject) {
        CSVParser.transform(data, (data) => {
            return {
                MFName: data[0],
                url: data[1].replace('https', 'http')
            };
        }, (err, data) => {
            if (err) {
                reject(err);
                return false;
            }

            //Removes the header row
            data.splice(0, 1);
            resolve(data);
        });
    }
}

module.exports = CSVLoader;