var mysql = require('mysql');

class ItemRepository {
    constructor() {
        this.connection = mysql.createConnection({
            host: '127.0.0.1',
            database: 'music_crawler',
            user: 'root',
            password: 'kokoboko'
        });
    }

    saveItem(item) {
        this.connection.query(
            `INSERT INTO items SET ?
             ON DUPLICATE KEY UPDATE ?`,
            [{
                mf_name: item.name,
                availability: item.availability,
                thumbnail: item.thumbnail,
                url: item.url,
                date_added: new Date(),
                last_crawl: new Date()
            }, {
                availability: item.availability,
                thumbnail: item.thumbnail,
                last_crawl: new Date()
            }], (err, results) => {
                if (err) {
                    throw new Error(err);
                }

                this.savePrice(results.insertId, item);
            });
    }

    savePrice(id, item) {
        this.connection.query(
            `INSERT INTO item_prices SET ?`,
            [{
                item_id: id,
                price: item.price,
                date: new Date()
            }], (err, results) => {
                if (err) {
                    throw new Error(err);
                }
            });
    }
}

module.exports = ItemRepository;