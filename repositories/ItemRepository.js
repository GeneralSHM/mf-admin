'use strict';

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

    getItemPageCount(itemsPerPage, query) {
        try {
            var escapedQuery = query.replace(/[+\-><\(\)~*\"@]+/g, ' ').trim();

        } catch (e) {
            escapedQuery = '';
        }

        let shouldSearch = typeof query == 'string' && escapedQuery !== '';

        if (typeof query == 'string') {
           var searchQuery = '*' + escapedQuery.split(' ').join('* *') + '*';
        }

        let SQLQuery = shouldSearch ? `
                 SELECT COUNT(id)
                 FROM items
                 WHERE
                     MATCH(mf_name,amazon_name) AGAINST(${this.connection.escape(searchQuery)} IN BOOLEAN MODE)
                `
            : `SELECT COUNT(id)
                 FROM items
                `;

        return new Promise((resolve, reject) => {
            this.connection.query(
                SQLQuery,
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
                 LEFT JOIN (SELECT item_id, price, MAX(date) max_date FROM item_prices GROUP BY item_id) prices ON items.id = prices.item_id
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

    getByName(page, itemsPerPage, query) {
        try {
            var escapedQuery = query.replace(/[+\-><\(\)~*\"@]+/g, ' ').trim();

        } catch (e) {
            escapedQuery = '';
        }

        let shouldSearch = typeof query == 'string' && escapedQuery !== '';

        if (shouldSearch) {
            var searchQuery = '*' + escapedQuery.split(' ').join('* *') + '*';
        }

        let SQLQuery = shouldSearch ? `
                 SELECT * FROM items
                 LEFT JOIN (SELECT item_id, price, MAX(date) max_date FROM item_prices GROUP BY item_id) prices ON items.id = prices.item_id
                 WHERE
                     MATCH(mf_name,amazon_name) AGAINST(${this.connection.escape(searchQuery)} IN BOOLEAN MODE)
                 ORDER BY id ASC
                 LIMIT ?, ?
                `
            : `SELECT *
                 FROM items
                 LEFT JOIN (SELECT item_id, price, MAX(date) max_date FROM item_prices GROUP BY item_id) prices ON items.id = prices.item_id
                 ORDER BY id ASC
                 LIMIT ?, ?
                `;


        return new Promise((resolve, reject) => {
            this.connection.query(
                SQLQuery,
                [
                    page * itemsPerPage,
                    itemsPerPage
                ],
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

module.exports = ItemRepository;