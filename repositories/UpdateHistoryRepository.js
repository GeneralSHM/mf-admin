'use strict';

const IS_DEBUG = process.env.DEBUG == 'debug';

class UpdateHistoryRepository {
    constructor(connection) {
        this.connection = connection;
    }

    savePrice(item) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `INSERT INTO updates SET ?`,
                [{
                    item_mf_name: item.item_mf_name,
                    what_changed: JSON.stringify(item.changes)
                }], (err, results) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
        });
    }

}

module.exports = UpdateHistoryRepository;
