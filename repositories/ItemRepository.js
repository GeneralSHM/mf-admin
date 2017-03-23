'use strict';

class ItemRepository {
    constructor(connection) {
        this.connection = connection;
    }

    saveItem(item) {
        return new Promise((resolve, reject) => {
            this.checkItem(item.name).then((result) => {
                if (result.found) {
                    if (result.item.mf_name == 'Behringer Battery BAT1 Replacement Battery for EPA40') {
                        console.log(result);
                    }

                    this.updateItem(item, result.item).then(() => {
                        resolve();
                    }).catch((error) => {
                        reject(error);
                    });
                } else {
                    this.insertItem(item).then(() => {
                        resolve();
                    }).catch((error) => {
                        reject(error);
                    });
                }
            }).catch((error) => {
               reject(error);
            });
        });
    }

    checkItem(mfName) {
        return new Promise((resolve, reject) => {
           this.connection.query(
                 `
                 SELECT *, items.id as item_real_id FROM items
                 LEFT JOIN (
                    SELECT p1.*
                    FROM item_prices p1 LEFT JOIN item_prices p2    
                    ON (p1.item_id = p2.item_id AND p1.id < p2.id)
                    WHERE p2.item_id IS NULL
                 ) prices ON items.id = prices.item_id
                 WHERE mf_name = ?
                `,
               [mfName],
               (err, results) => {
                   if (err) {
                       reject(err);
                   } else {
                      if (results.length > 0) {
                          resolve({
                              item: results[0],
                              found: true
                          });
                      } else {
                          resolve({
                              item: {},
                              found: false
                          });
                      }
                   }
               }
           );
        });
    }

    updateItem(newData, oldData) {
        return new Promise((resolve, reject) => {
            if (
                newData.availability == oldData.availability
                && newData.thumbnail == oldData.thumbnail
                && parseFloat(newData.price.toFixed(2)) == parseFloat(oldData.price.toFixed(2))
            ) {
                resolve();
            } else {
                this.connection.query(
                    `UPDATE items
                    SET ?
                    WHERE mf_name = ?
                    `,
                    [
                        {
                            availability: newData.availability,
                            has_status_changed: newData.availability != oldData.availability,
                            thumbnail: newData.thumbnail,
                            is_url_active: true,
                            last_change: new Date()
                        },
                        oldData.mf_name
                    ],
                    (err, results) => {
                        if (err) {
                            reject(err);
                        } else {
                            this.savePrice(oldData.item_real_id, newData).then((results) => {
                                resolve();
                            }).catch((error) => {
                                reject(error);
                            })
                        }
                    }
                );
            }
        });
    }

    insertItem(item) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `INSERT INTO items SET ?`,
                [{
                    mf_name: item.name,
                    availability: item.availability,
                    has_status_changed: false,
                    thumbnail: item.thumbnail,
                    url: item.url,
                    date_added: new Date(),
                    last_change: new Date()
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

    checkPrice(id, item) {
        return new Promise((resolve, reject) => {


            this.connection.query(
                `SELECT price FROM item_prices 
                 WHERE item_id = ?
                 ORDER BY date DESC
                 LIMIT 1
                `,
                [id],
                (err, results) => {
                    if (err) {
                        reject(err);
                    } else if (results[0] == null ||  parseFloat(results[0].price.toFixed(2)) != parseFloat(item.price.toFixed(2))) {
                        resolve(results[0] != null ? parseFloat(results[0].price.toFixed(2)) : null);
                    } else {
                        reject();
                    }
                }
            )
        });
    }

    savePrice(id, item) {
        return new Promise((resolve, reject) => {
            this.checkPrice(id, item).then((oldPrice) => {
                // if (item.name == 'Behringer Battery BAT1 Replacement Battery for EPA40') {
                //     debugger;
                // }

                this.connection.query(
                    `INSERT INTO item_prices SET ?`,
                    [{
                        item_id: id,
                        price: item.price,
                        diff: oldPrice != null ? parseFloat((item.price - oldPrice).toFixed(2)) : 0,
                        date: new Date()
                    }], (err, results) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(results);
                        }
                    });
            }).catch((err) => {
                resolve('Item price not new!');
            })
        });
    }

    getAll() {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `SELECT mf_name as MFName, url FROM items`,
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
                 LEFT JOIN (
                    SELECT p1.*
                    FROM item_prices p1 LEFT JOIN item_prices p2
                    ON (p1.item_id = p2.item_id AND p1.id < p2.id)
                    WHERE p2.item_id IS NULL
                 ) prices ON items.id = prices.item_id
                 ORDER BY items.id ASC
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
                 LEFT JOIN (
                    SELECT p1.*
                    FROM item_prices p1 LEFT JOIN item_prices p2
                    ON (p1.item_id = p2.item_id AND p1.id < p2.id)
                    WHERE p2.item_id IS NULL
                 ) prices ON items.id = prices.item_id
                 WHERE
                     MATCH(mf_name,amazon_name) AGAINST(${this.connection.escape(searchQuery)} IN BOOLEAN MODE)
                 ORDER BY items.id ASC
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