'use strict';

const MainConfig = require('../configs/main.config');

const IS_DEBUG = process.env.DEBUG == 'debug';
const UpdateHistoryRepository = require('./UpdateHistoryRepository');

class ItemRepository {
    constructor(connection) {
        this.connection = connection;
        this.updateHistoryRepository = new UpdateHistoryRepository(connection);
    }

    saveItem(item) {
        return new Promise((resolve, reject) => {
            this.checkItem(item.name).then((result) => {
                if (result.found) {
                    item.is_url_active = true;

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

    deleteItem(id) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `DELETE FROM items
                 WHERE id = ? 
                `,
                [id],
                (err, results) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(results);
                    }
                }
            );
        });
    }

    editItem(id, data) {
        return new Promise((resolve, reject) => {
           this.connection.query(
               `UPDATE items
                SET ?
                WHERE id = ?
               `,
               [
                   data,
                   id
               ],
               (err, results) => {
                   if (err) {
                       console.error(err);
                       reject(err);
                   } else {
                       resolve(results);
                   }
               }
           );
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
                       console.error(err);
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
            let newPrice = newData.price != null ? newData.price.toFixed(2) : 0;
            let oldPrice = oldData.price != null ? oldData.price.toFixed(2) : 0;

            if (!newData.sku) {
                newData.sku = oldData.amazon_name;
            }

            let isCrawling = MainConfig.IS_CRAWLING;
            let hasSkuChanged = newData.sku == oldData.amazon_name;
            if (isCrawling) {
                hasSkuChanged = true;
            }

            if (
                newData.availability == oldData.availability
                && newData.is_url_active == oldData.is_url_active
                && parseFloat(newPrice) == parseFloat(oldPrice)
                && hasSkuChanged
            ) {
                resolve();
            } else {
                this.updateHistoryRepository.savePrice({
                    item_mf_name: oldData.mf_name,
                    changes: {
                        availability: newData.availability == oldData.availability,
                        thumbnail: newData.thumbnail == oldData.thumbnail,
                        is_url_active: newData.is_url_active == oldData.is_url_active,
                        price: parseFloat(newPrice) == parseFloat(oldPrice),
                        sku: newData.sku == oldData.amazon_name
                    }
                });
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
                            amazon_name: newData.sku,
                            last_change: new Date()
                        },
                        oldData.mf_name
                    ],
                    (err, results) => {
                        if (err) {
                            console.error(err);
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
                    last_change: new Date(),
                    amazon_name: item.sku
                }], (err, results) => {
                    if (err) {
                        console.error(err);
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
                        console.error(err);
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
                this.connection.query(
                    `INSERT INTO item_prices SET ?`,
                    [{
                        item_id: id,
                        price: item.price,
                        diff: oldPrice != null ? parseFloat((item.price - oldPrice).toFixed(2)) : 0,
                        date: new Date()
                    }], (err, results) => {
                        if (err) {
                            console.error(err);
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
                `SELECT mf_name as MFName, url, amazon_name as sku FROM items`,
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

    getItemPageCount(itemsPerPage, query) {
        try {
            var escapedQuery = query.replace(/[+\-><\(\)~*\"@]+/g, ' ').trim();

        } catch (e) {
            escapedQuery = '';
        }

        let shouldSearch = typeof query == 'string' && escapedQuery !== '';

        if (typeof query == 'string') {
           var searchQuery = '*' + escapedQuery.split(' ').join('* *') + '*';
           var searchString = this.connection.escape(searchQuery);
        }


        let SQLQuery = shouldSearch ? `
                 SELECT COUNT(id)
                 FROM items
                 WHERE
                 (
                    mf_name = ${searchString}
                 OR
                    amazon_name = ${searchString}
                 )
                 `
            : `SELECT COUNT(id)
                 FROM items
                `;

        return new Promise((resolve, reject) => {
            this.connection.query(
                SQLQuery,
                (err, count) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(Math.ceil(count[0]['COUNT(id)'] / itemsPerPage));
                    }
                }
            )
        });
    }

    getItemPage(page, itemsPerPage, query, sort, sortBy) {
        let orderStatement = sortBy == 'status' ? `items.availability ${sort}, items.last_change DESC` : `items.last_change ${sort}` ;

        if (IS_DEBUG || 1===1) {
            console.log(JSON.stringify(sortBy));
            console.log(orderStatement);
        }


        return new Promise((resolve, reject) => {
            this.connection.query(
                `SELECT * FROM items
                 LEFT JOIN (
                    SELECT p1.*
                    FROM item_prices p1 LEFT JOIN item_prices p2
                    ON (p1.item_id = p2.item_id AND p1.id < p2.id)
                    WHERE p2.item_id IS NULL
                 ) prices ON items.id = prices.item_id
                 ORDER BY ${orderStatement}
                 LIMIT ?, ?
                `, [
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

    setInactive(url) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `UPDATE items SET is_url_active = 0
                 WHERE url = ?`,
                [url],
                (err, results) => {
                    if (err) {
                        console.error(err);
                        reject(err)
                } else {
                        resolve(results);
                    }
                }
            )
        });
    }

    getByName(page, itemsPerPage, query, order, orderBy) {
        try {
            var escapedQuery = query.replace(/[+\-><\(\)~*\"@]+/g, ' ').trim();

        } catch (e) {
            escapedQuery = '';
        }

        let orderStatement = orderBy == 'status' ? `items.availability ${order}, items.last_change DESC` : `items.last_change ${order}` ;

        let shouldSearch = typeof query == 'string' && escapedQuery !== '';

        if (shouldSearch) {
            var searchQuery = '*' + escapedQuery.split(' ').join('* *') + '*';
        }

        query = '%' + query + '%';
        let searchString = this.connection.escape(query);

        let SQLQuery = shouldSearch ? `
                 SELECT * FROM items
                 LEFT JOIN (
                    SELECT p1.*
                    FROM item_prices p1 LEFT JOIN item_prices p2
                    ON (p1.item_id = p2.item_id AND p1.id < p2.id)
                    WHERE p2.item_id IS NULL
                 ) prices ON items.id = prices.item_id
                 WHERE
                    (
                        mf_name LIKE ${searchString}
                    OR
                        amazon_name LIKE ${searchString}
                    )
                 ORDER BY ${orderStatement}
                 LIMIT ?, ?
                `
            : `SELECT *
                 FROM items
                 LEFT JOIN (SELECT item_id, diff, price, MAX(date) max_date FROM item_prices GROUP BY item_id) prices ON items.id = prices.item_id
                 ORDER BY ${orderStatement}
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