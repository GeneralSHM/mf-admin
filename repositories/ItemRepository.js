'use strict';

const MainConfig = require('../configs/main.config');

const IS_DEBUG = process.env.DEBUG == 'debug';
const UpdateHistoryRepository = require('./UpdateHistoryRepository');
const AmazonApiService = require('../services/amazon');

class ItemRepository {
    constructor(connection) {
        this.connection = connection;
        this.updateHistoryRepository = new UpdateHistoryRepository(connection);
        this.amazonApiService = new AmazonApiService();
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
            if (newData.availability === 'out_of_stock') {
                if (newData.price === -1 && oldData.price >= 0) {
                    newData.price = oldData.price;
                }
            }

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
                && parseInt(newData.brand) === parseInt(oldData.brand_id)
            ) {
                resolve();
            } else {

                if (newData.availability == 'out_of_stock'){
                    this.amazonApiService.addProduct({
                        MFName: oldData.mf_name,
                        sku: newData.sku
                    });
                }

                this.updateHistoryRepository.savePrice({
                    item_mf_name: oldData.mf_name,
                    changes: {
                        availability: newData.availability === oldData.availability,
                        thumbnail: newData.thumbnail === oldData.thumbnail,
                        is_url_active: newData.is_url_active === oldData.is_url_active,
                        price: parseFloat(newPrice) === parseFloat(oldPrice),
                        sku: newData.sku === oldData.amazon_name,
                        brand: parseInt(newData.brand) === parseInt(oldData.brand_id)
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
                            last_change: new Date(),
                            brand_id: newData.brand
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
                    amazon_name: item.sku,
                    brand_id: item.brand
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
                `SELECT mf_name as MFName, url, amazon_name as sku, brand.id as brandID FROM items left join brand on (items.brand_id = brand.id)`,
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

    getItemPageCount(itemsPerPage, query, brandIds, priceFrom, priceTo) {
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

        var brandQuery = '';
        if (brandIds.length > 0) {
            if (shouldSearch) {
                brandQuery = 'AND items.brand_id IN (-1 '
            } else {
                brandQuery = 'WHERE items.brand_id IN (-1 ';
            }
            brandIds.forEach(brandId => brandQuery += ',' + brandId);
            brandQuery += ') ';
        }

        var priceQuery = '';
        if (priceFrom && priceTo) {
            if (brandQuery || shouldSearch) {
                priceQuery = 'AND prices.price BETWEEN ' + priceFrom + ' AND ' + priceTo;
            } else {
                priceQuery = 'WHERE prices.price BETWEEN ' + priceFrom + ' AND ' + priceTo + ' ';
            }
        }

        let SQLQuery = shouldSearch ? `
                 SELECT COUNT(items.id)
                 FROM items
                 LEFT JOIN (
                    SELECT p1.*
                    FROM item_prices p1 LEFT JOIN item_prices p2
                    ON (p1.item_id = p2.item_id AND p1.id < p2.id)
                    WHERE p2.item_id IS NULL
                 ) prices ON items.id = prices.item_id
                 ${brandQuery}
                 ${priceQuery}
                 `
            : `SELECT COUNT(items.id)
                 FROM items
                 LEFT JOIN (
                    SELECT p1.*
                    FROM item_prices p1 LEFT JOIN item_prices p2
                    ON (p1.item_id = p2.item_id AND p1.id < p2.id)
                    WHERE p2.item_id IS NULL
                 ) prices ON items.id = prices.item_id
                 ${brandQuery}
                 ${priceQuery}
                `;

        return new Promise((resolve, reject) => {
            this.connection.query(
                SQLQuery,
                (err, count) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve(Math.ceil(count[0]['COUNT(items.id)'] / itemsPerPage));
                    }
                }
            )
        });
    }

    getItemsForCsvExport() {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `SELECT items.mf_name as name, 
                items.url as url, 
                items.amazon_name as sku,
                items.availability, 
                items.send_to_amazon,
                brand.name as brand 
                FROM \`items\` 
                LEFT JOIN brand 
                ON (brand.id = items.brand_id)
                `,
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

    getItemPage(page, itemsPerPage, query, sort, sortBy, brandIds, priceFrom, priceTo) {
        let orderStatement = sortBy == 'status' ? `items.availability ${sort}, items.last_change DESC` : `items.last_change ${sort}` ;

        if (IS_DEBUG || 1===1) {
            //console.log(JSON.stringify(sortBy));
            //console.log(orderStatement);
        }

        var brandQuery = '';
        if (brandIds.length > 0) {
            brandQuery = 'WHERE items.brand_id IN (-1 ';
            brandIds.forEach(brandId => brandQuery += ',' + brandId);
            brandQuery += ') ';
        }

        var priceQuery = '';
        if (priceFrom && priceTo) {
            if (brandQuery) {
                priceQuery = 'AND prices.price BETWEEN ' + priceFrom + ' AND ' + priceTo;
            } else {
                priceQuery = 'WHERE prices.price BETWEEN ' + priceFrom + ' AND ' + priceTo + ' ';
            }
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
                 ${brandQuery}
                 ${priceQuery}
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

    updateAmazonStatus(itemId) {
        itemId = parseInt(itemId);
        return new Promise((resolve, reject) => {
            this.connection.query(
                `UPDATE items
                 SET items.send_to_amazon = (SELECT I2.send_to_amazon FROM (SELECT if(send_to_amazon = 1, 0, 1) as send_to_amazon FROM items WHERE id = ?) as I2)
                 WHERE items.id = ?`,
                [itemId, itemId],
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

    setInactive(url) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `UPDATE items SET is_url_active = 0,
                 availability = 'out_of_stock'
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

    updateItemBrand(itemId, brandId) {
        return new Promise((resolve, reject) => {
            this.connection.query(
                `UPDATE items SET brand_id = ?
                 WHERE id = ?`,
                [brandId, itemId],
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

    getByName(page, itemsPerPage, query, order, orderBy, brandIds, priceFrom, priceTo) {
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

        var brandQuery = '';
        if (brandIds.length > 0) {
            if (shouldSearch) {
                brandQuery = 'AND items.brand_id IN (-1 '
            } else {
                brandQuery = 'WHERE items.brand_id IN (-1 ';
            }
            brandIds.forEach(brandId => brandQuery += ',' + brandId);
            brandQuery += ') ';
        }

        var priceQuery = '';
        if (priceFrom && priceTo) {
            if (shouldSearch || brandQuery) {
                priceQuery = 'AND prices.price BETWEEN ' + priceFrom + ' AND ' + priceTo;
            } else {
                priceQuery = 'WHERE prices.price BETWEEN ' + priceFrom + ' AND ' + priceTo + ' ';
            }
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
                    ${brandQuery}
                    ${priceQuery}
                 ORDER BY ${orderStatement}
                 LIMIT ?, ?
                `
            : `SELECT *
                 FROM items
                 LEFT JOIN (SELECT item_id, diff, price, MAX(date) max_date FROM item_prices GROUP BY item_id) prices ON items.id = prices.item_id
                 ${brandQuery}
                 ${priceQuery}
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
