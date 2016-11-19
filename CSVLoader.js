const fs = require('fs');
const CSVParser = require('csv');


class CSVLoader {
    constructor() {
        this.data = null;
    }

    load(url) {
        fs.readFile(url, 'utf8', (err, data) => {
            if (err) {
                throw new Error(err);
            }

            this.parse(data);
        });
    }

    parse(data) {
        CSVParser.parse(data, (err, data) => {
            if (err) {
                throw new Error(err);
            }
            this.transform(data);
        });
    }

    transform(data) {
        CSVParser.transform(data, (data) => {
            return {
                name: data[0],
                url: data[1],
                sale: isNaN(parseFloat(data[2].replace('$', '').trim())) ? null : parseFloat(data[2].replace('$', '').replace(',', '.').trim()),
                price: isNaN(parseFloat(data[3].replace('$', '').trim())) ? null : parseFloat(data[3].replace('$', '').replace(',', '.').trim())
            };
        }, (err, data) => {
            if (err) {
                throw new Error(err);
            }

            this.data = data;
            console.log(data);
        });
    }
}

module.exports = CSVLoader;