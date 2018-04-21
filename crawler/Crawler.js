const cheerio = require('cheerio');

const HttpService = require('./HttpService');
const ItemRepository = require('../repositories/ItemRepository');
const BrandingService = require('../services/branding');
const CSVLoader = require('./CSVLoader');
const AmazonApiService = require('../services/amazon');

const MainConfig = require('../configs/main.config');

const httpService = new HttpService();

const IS_DEBUG = process.env.DEBUG == 'debug';

class Crawler {
    constructor(connection) {
        this.lastItems = [];
        this.itemRepository = new ItemRepository(connection);
        this.csvLoader = new CSVLoader();
        this.counter = 1;
        this.amazonApiService = new AmazonApiService();
        this.brandingService = new BrandingService(connection);

        this.spaceCodes = [
            /\u0020+/g,
            /\u00A0+/g,
            /\u1680+/g,
            /\u180E+/g,
            /\u2000+/g,
            /\u2001+/g,
            /\u2002+/g,
            /\u2003+/g,
            /\u2004+/g,
            /\u2005+/g,
            /\u2006+/g,
            /\u2007+/g,
            /\u2008+/g,
            /\u2009+/g,
            /\u200A+/g,
            /\u200B+/g,
            /\u202F+/g,
            /\u205F+/g,
            /\u3000+/g,
            /\uFEFF+/g,
            /\s+/g
        ];
    }

    scrapeCSV(url) {
        return new Promise((resolve, reject) => {
            this.csvLoader.extractItems(url).then((items) => {
                // add brands before that.
                this.brandingService.insertNonExistingBrandsByName(items).then((items) => {
                    this.fetchFromList(items).then((failedItems) => {
                        resolve(failedItems);
                    }).catch((error) => {
                        reject(error);
                    });
                });
            }).catch((e) => {
                reject(e);
            });
        });
    }

    fetchFromList(itemList) {
        this.counter = 0;
        let itemPromises = [];
        let timeout = 0;

        let failedItems = [];

        for (let item of itemList) {
            itemPromises.push(new Promise((resolve, reject) => {
                setTimeout(() => {
                    item.url = Crawler.formatUrl(item.url);

                    this.fetchFrom(item.url, item.MFName, item.sku, item.brandID).then(() => {
                        if (IS_DEBUG) {
                            console.log(this.counter++ + ' Fetch from "' + item.url + '" complete!');
                        }
                        resolve();
                    }).catch((e) => {
                        if (e.noMatch) {
                            failedItems.push(e.item);
                            resolve();
                        } else {
                            console.error('URL: ' + item.url);
                            console.error(e);
                            this.itemRepository.setInactive(item.url).then(() => {
                                resolve();
                            }).catch((error) => {
                                reject(error);
                            });
                        }
                    });
                }, timeout);

                timeout += MainConfig.TIMEOUT_STEP;
            }));
        }

        return new Promise((resolve, reject) => {
            Promise.all(itemPromises).then(() => {
                resolve(failedItems);
            }).catch((error) => {
                reject(error);
            })
        });
    }

    fetchFrom(url, itemName, sku, brand, isSingleItem, tryCount = 0) {
        if (!sku) {
            sku = '';
        }
        if (!brand) {
            brand = 0;
        }
        return new Promise((resolve, reject) => {
            httpService.get(url).then((html) => {
                let lastItems = this.getPrices(html, url, itemName, isSingleItem);
                if (parseInt(lastItems.length) === 0) {
                    reject({
                        noMatch: true,
                        item: {
                            url: url,
                            itemName: itemName,
                            sku: sku,
                            brand: brand
                        }
                    });
                } else {
                    lastItems.forEach((item) => {
                      item.sku = sku;
                      if (item.name === itemName) {
                          item.brand = brand;
                      } else {
                          item.brand = 0;
                      }
                    });
                    this.saveItems(lastItems).then(() => {
                        resolve(itemName);
                    }).catch((error) => {
                        reject(error);
                    });
                }
            }).catch((e) => {
                if (parseInt(e.statusCode) === 301) {
                    if (tryCount === 3) {
                        console.error(e);
                        reject(e);
                    }
                    this.fetchFrom(e.location, itemName, sku, brand, isSingleItem, (tryCount + 1)).then((itemName) => {
                        resolve(itemName);
                    }).catch((error) => {
                        reject(error);
                    })
                } else if (parseInt(e.statusCode) === 404) {
                    if (tryCount === 4) {
                        console.error(e);
                        reject(e);
                    } else {
                        this.fetchFrom(url, itemName, sku, brand, isSingleItem, (tryCount + 1)).then((itemName) => {
                            resolve(itemName);
                        }).catch((error) => {
                            reject(error);
                        });
                    }
                } else {
                    if (tryCount === 2) {
                    console.error(e);
                    reject(e);
                    } else
                        if (e.message == 'Protocol "https:" not supported. Expected "http:"') {
                    url = url.replace('https', 'http');
                    this.fetchFrom(url, itemName, sku, brand, isSingleItem, (tryCount + 1)).then((itemName) => {
                                    resolve(itemName);
                                }).catch((error) => {
                                    reject(error);
                                });
                    }
                }
            });
        });
    }

    fetchFromDB() {
        return new Promise((resolve, reject) => {
            this.amazonApiService.generateNewReportId().then((res) => {
                const reportId = res.data;
                this.itemRepository.getAll().then((items) => {
                    this.fetchFromList(items).then((failedItems) => {
                        this.itemRepository.getItemsForCsvExport().then((items) => {
                            this.amazonApiService.sendProductsToApii(items, reportId);
                        });
                        resolve(failedItems);
                    }).catch((error) => {
                        reject(error);
                    });
                }).catch((e) => {
                    throw new Error(e);
                });
            });
        });
    }

    getPrices(html, url, itemName, isSingleMatch) {
        let items = [];
        let $ = cheerio.load(html);
        let itemVariations = $('var.styleInfo');

        let DOMElements = itemVariations.length > 0 ? itemVariations : $('var.price');

        if ($('#prodoutofstock_rr > h3').length === 1) {
            items.push({
                name: itemName,
                availability: 'out_of_stock',
                url: url,
                price: -1,
                thumbnail: $($('[itemprop="image"]')[0]).attr('content')
            });
            return items;
        }
        for (var i = 0; i < DOMElements.length; i++) {
            let parsedElement = this.parseItem($, DOMElements[i], url);

            if (typeof itemName != 'undefined' && !isSingleMatch && (parsedElement.name.toLocaleLowerCase().includes(itemName.toLocaleLowerCase()) || itemName.toLocaleLowerCase().includes(parsedElement.name.toLocaleLowerCase()))) {
                items.push(parsedElement);
                break;

            } else if (typeof itemName != 'undefined' && isSingleMatch && parsedElement.name.toLocaleLowerCase() == itemName.toLocaleLowerCase()) {
                items.push(parsedElement);
                break;
            }
            else if (typeof itemName == 'undefined') {
                items.push(parsedElement);
            }

        }

        return items;
    }

    parseItem($, item, url) {
        try {
            item = JSON.parse($(item).text());
        } catch (e) {
            item = $(item).text();
        }

        let parsedItem;

        if (typeof item != 'object') {
            parsedItem = {
                name: this.replaceSpaces($('div[itemprop="name"]').text()).trim().replace(/\n+/g, ''),
                availability: this.getAvailability($),
                price: parseFloat(item.toString().replace(/,/g, ''))
            };

        } else {
            parsedItem = {
                name: this.replaceSpaces($('div[itemprop="name"]').text().trim().split('\n')[0]).trim() + ` ${item.name}`,
                availability: item.inventoryKey != 'in_stock' ? 'out_of_stock' : item.inventoryKey,
                price: parseFloat(item.price.toString().replace(/,/g, ''))
            };
        }
        parsedItem.thumbnail = $($('[itemprop="image"]')[0]).attr('content');
        parsedItem.url = url;

        return parsedItem;
    }

    getAvailability($) {
        let availability = $($('var.availability')[0]).text();
        return availability != '' ? availability : 'out_of_stock';
    }

    saveItems(lastItems) {
        let itemPromises = [];

        for (let i = 0; i < lastItems.length; i++) {
            itemPromises.push(this.itemRepository.saveItem(lastItems[i]));
        }

        return new Promise((resolve, reject) => {
            Promise.all(itemPromises).then(() => {
                const products = this.itemRepository.amazonApiService.changedProducts;
                for (let i =0; i < products.length; i++) {
                    this.amazonApiService.addProduct(products[i]);
                }
                this.amazonApiService.sendProductsToApi();
                resolve();
            }).catch((error) => {
                reject(error);
            });
        })
    }

    deleteItem(id) {
        return new Promise((resolve, reject) => {
            this.itemRepository.deleteItem(id).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    editItem(id, data) {
        return new Promise((resolve, reject) => {
            this.itemRepository.editItem(id, data).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }

    static formatUrl(url) {
        let formattedURL = null;
        let countryIndex = url.indexOf('cntry=us');
        let hasQuery = url.indexOf('?') != -1;
        let hashIndex = url.indexOf('#');

        if (countryIndex == -1 && hasQuery) {
            formattedURL = hashIndex == -1 ? url + '&cntry=us' : url.replace('#', '&cntry=us#');
        } else if (countryIndex == -1 && !hasQuery) {
            formattedURL = hashIndex == -1 ? url + '?cntry=us' : url.replace('#', '?cntry=us#');
        } else {
            formattedURL = url;
        }

        return formattedURL;
    }

    replaceSpaces(string) {
        this.spaceCodes.forEach((code) => {
            string = string.replace(code, ' ');
        });

        return string;
    }
}

module.exports = Crawler;
