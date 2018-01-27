'use strict';

const MainConfig = require('../configs/main.config');

const IS_DEBUG = process.env.DEBUG == 'debug';

class BrandRepository {
    constructor(connection) {
        this.connection = connection;
    }

    addBrand(name) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `INSERT INTO brand SET ?`,
                [{
                    name: name
                }], (err, results) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
        });
    }

    getAllBrands() {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `SELECT * FROM brand WHERE active = 1`,
                (err, results) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            )
        });
    }
}

module.exports = BrandRepository;