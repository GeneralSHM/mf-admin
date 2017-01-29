class ItemRepository {
    constructor(connection) {
        this.connection = connection;
    }

    saveItem(item) {
        return new Promise((resolve, reject) => {
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
                    is_url_active: true,
                    last_crawl: new Date()
                }], (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.savePrice(results.insertId, item).then((results) => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        })
                    }
                });
        });
    }

    savePrice(id, item) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `INSERT INTO item_prices SET ?`,
                [{
                    item_id: id,
                    price: item.price,
                    date: new Date()
                }], (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
        });
    }

    getAll() {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `SELECT * FROM items`,
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            )
        });
    }

    getItemPageCount(itemsPerPage, searchName) {
        let queryParam = typeof searchName != 'undefined' ? searchName : '';

        return new Promise((resolve, reject) => {
            this.connection.query(
                `SELECT COUNT(id) FROM items
                 WHERE
                      CONCAT(mf_name, amazon_name) LIKE '%${queryParam}%'
                `,
                (err, count) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(Math.ceil(count[0]['COUNT(id)'] / itemsPerPage));
                    }
                }
            )
        });
    }

    getItemPage(page, itemsPerPage) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `SELECT * FROM items
                 ORDER BY id ASC
                 LIMIT ?, ?
                `, [
                    page * itemsPerPage,
                    itemsPerPage
                ],
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            )
        });
    }

    setInactive(url) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `UPDATE items SET is_url_active = 0
                 WHERE url = ?`,
                [url],
                (err, results) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(results);
                    }
                }
            )
        });
    }

    getByName(page, itemsPerPage, name) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `SELECT *
                 FROM items
                 WHERE
                     CONCAT(mf_name,amazon_name) LIKE '%${name}%'
                 ORDER BY mf_name ASC
                 LIMIT ?, ?
                `,
                [
                    page * itemsPerPage,
                    itemsPerPage
                ],
                (err, results) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(results);
                    }
                }
            )
        });
    }
}

module.exports = ItemRepository;