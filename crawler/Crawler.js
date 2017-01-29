const cheerio = require('cheerio');

const HttpService = require('./HttpService');
const ItemRepository = require('./ItemRepository');
const CSVLoader = require('./CSVLoader');

const httpService = new HttpService();

class Crawler {
    constructor() {
        this.lastItems = [];
        this.itemRepository = new ItemRepository();
        this.csvLoader = new CSVLoader();
        this.counter = 1;
        this.matchCounter = 0;

        this.spaceCodes = [
            /\u0020/g,
            /\u00A0/g,
            /\u1680/g,
            /\u180E/g,
            /\u2000/g,
            /\u2001/g,
            /\u2002/g,
            /\u2003/g,
            /\u2004/g,
            /\u2005/g,
            /\u2006/g,
            /\u2007/g,
            /\u2008/g,
            /\u2009/g,
            /\u200A/g,
            /\u200B/g,
            /\u202F/g,
            /\u205F/g,
            /\u3000/g,
            /\uFEFF/g
        ];
    }

    scrapeCSV(url) {
        return new Promise((resolve, reject) => {
            this.csvLoader.extractItems(url).then((items) => {
                this.fetchFromList(items).then(() => {
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
            }).catch((e) => {
                throw new Error(e);
            });
        });
    }

    fetchFromList(itemList) {
        let itemPromises = [];
        let timeout = 0;
        let timeoutStep = 150;

        for (let item of itemList) {
            itemPromises.push(new Promise((resolve, reject) => {
                setTimeout(() => {
                    this.fetchFrom(item.url, item.MFName).then(() => {
                        console.log(this.counter++ + ' Fetch from "' + item.url + '" complete!');
                        resolve();
                    }).catch((e) => {
                        console.error('URL: ' + item.url);
                        console.error(e);
                        this.itemRepository.setInactive(item.url).then(() => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });
                    });
                }, timeout);

                timeout += timeoutStep;
            }));
        }

        return new Promise((resolve, reject) => {
            Promise.all(itemPromises).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        });
    }

    fetchFrom(url, itemName) {
        return new Promise((resolve, reject) => {
            httpService.get(url).then((html) => {
                let lastItems = this.getPrices(html, url, itemName);
                this.saveItems(lastItems).then(() => {
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
            }).catch((e) => {
                reject(e);
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
        item = JSON.parse($(item).text());
        let parsedItem;

        if (typeof item != 'object') {
            parsedItem = {
                name: this.replaceSpaces($('div[itemprop="name"]').text().trim()),
                availability: this.getAvailability($),
                price: item
            };
        } else {
            parsedItem = {
                name: this.replaceSpaces($('div[itemprop="name"]').text().trim().replace('\n', '') + ' ' + item.name),
                availability: item.inventoryKey,
                price: item.price
            };
        }
        parsedItem.thumbnail = $($('[itemprop="image"]')[0]).attr('content');
        parsedItem.url = url;

        return parsedItem;
    }

    getAvailability($) {
        let availability = $($('var.availability')[0]).text();
        return availability != '' ? availability : $($('.outOfStockMessage')[0]).text();
    }

    saveItems(lastItems) {
        let itemPromises = [];

        for (let i = 0; i < lastItems.length; i++) {
            console.log('MATCH: ', ++this.matchCounter);
            itemPromises.push(this.itemRepository.saveItem(lastItems[i]));
        }

        return new Promise((resolve, reject) => {
            Promise.all(itemPromises).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    }

    listItems() {
        for (let i = 0; i < this.lastItems.length; ++i) {
            console.log('Name: ' + this.lastItems[i].name + ' Price: ' + this.lastItems[i].price + ' Availability: ' + this.lastItems[i].availability);
            console.log('Thumbnail: ' + this.lastItems[i].thumbnail)
        }
    }

    replaceSpaces(string) {
        this.spaceCodes.forEach((code) => {
            string = string.replace(code, ' ');
        });

        return string;
    }
}

module.exports = Crawler;