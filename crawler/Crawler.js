const cheerio = require('cheerio');

const HttpService = require('./HttpService');
const ItemRepository = require('../repositories/ItemRepository');
const CSVLoader = require('./CSVLoader');

const MainConfig = require('../configs/main.config');

const httpService = new HttpService();

const IS_DEBUG = process.env.DEBUG == 'debug';

class Crawler {
    constructor(connection) {
        this.lastItems = [];
        this.itemRepository = new ItemRepository(connection);
        this.csvLoader = new CSVLoader();
        this.counter = 1;

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
                this.fetchFromList(items).then((failedItems) => {
                    resolve(failedItems);
                }).catch((error) => {
                    reject(error);
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

                    this.fetchFrom(item.url, item.MFName).then(() => {
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

    fetchFrom(url, itemName) {
        return new Promise((resolve, reject) => {
            httpService.get(url).then((html) => {
                let lastItems = this.getPrices(html, url, itemName);
                if (lastItems.length == 0) {
                    reject({
                        noMatch: true,
                        item: {
                            url: url,
                            itemName: itemName
                        }
                    });
                } else {
                    this.saveItems(lastItems).then(() => {
                        resolve(itemName);
                    }).catch((error) => {
                        reject(error);
                    });
                }
            }).catch((e) => {
                if (e.statusCode == 301) {
                    this.fetchFrom(e.location, itemName).then((itemName) => {
                        resolve(itemName);
                    }).catch((error) => {
                        reject(error);
                    })
                } else {
                    console.error(e);
                    reject(e);
                }
            });
        });
    }

    fetchFromDB() {
        return new Promise((resolve, reject) => {
            this.itemRepository.getAll().then((items) => {
                this.fetchFromList(items).then((failedItems) => {
                    resolve(failedItems);
                }).catch((error) => {
                    reject(error);
                });
            }).catch((e) => {
                throw new Error(e);
            });
        });
    }

    getPrices(html, url, itemName) {
        let items = [];
        let $ = cheerio.load(html);
        let itemVariations = $('var.styleInfo');

        let DOMElements = itemVariations.length > 0 ? itemVariations : $('var.price');

        for (var i = 0; i < DOMElements.length; i++) {
            let parsedElement = this.parseItem($, DOMElements[i], url);

            if (typeof itemName != 'undefined' && (parsedElement.name.toLocaleLowerCase().includes(itemName.toLocaleLowerCase()) || itemName.toLocaleLowerCase().includes(parsedElement.name.toLocaleLowerCase()))) {
                items.push(parsedElement);
                break;

            } else if (typeof itemName == 'undefined') {
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