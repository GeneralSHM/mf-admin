const HttpService = require('./HttpService');
const ItemRepository = require('./ItemRepository');

const cheerio = require('cheerio');

let httpSerice = new HttpService();

class Crawler {
    constructor() {
        this.lastItems = [];
        this.$ = null;
        this.itemRepository = new ItemRepository();
        this.lastScrapedUrl = null;
    }

    fetchFrom(url) {
        this.lastScrapedUrl = url;

        return new Promise((resolve, reject) => {
            httpSerice.get(url).then((html) => {
                this.lastItems = this.getPrices(html);
                this.saveItems();
                resolve();
            }).catch((e) => {
                reject(e);
            });
        });
    }

    getPrices(html) {
        let items = [];
        this.$ = cheerio.load(html);
        let itemVariations = this.$('var.styleInfo');

        let DOMElements = itemVariations.length > 0 ? itemVariations : this.$('var.price');

        for (var i = 0; i < DOMElements.length; i++) {
            let parsedElement = this.parseItem(DOMElements[i]);
            items.push(parsedElement);
        }

        return items;
    }

    parseItem(item) {
        let $ = this.$;

        item = JSON.parse($(item).text());
        let parsedItem;

        if (typeof item != 'object') {
            parsedItem = {
                name: this.$('div[itemprop="name"]').text().trim(),
                availability: $($('var.availability')[0]).text(),
                price: item
            };
        } else {
            parsedItem = {
                name: item.name,
                availability: item.inventoryKey,
                price: item.price
            };
        }
        parsedItem.thumbnail = $($('[itemprop="image"]')[0]).attr('content');
        parsedItem.url = this.lastScrapedUrl;

        return parsedItem;
    }

    saveItems() {
        for (let i = 0; i < this.lastItems.length; i++) {
            this.itemRepository.saveItem(this.lastItems[i]);
        }
    }

    listItems() {
        for (let i = 0; i < this.lastItems.length; ++i) {
            console.log('Name: ' + this.lastItems[i].name + ' Price: ' + this.lastItems[i].price + ' Availability: ' + this.lastItems[i].availability);
            console.log('Thumbnail: ' + this.lastItems[i].thumbnail)
        }
    }

}

module.exports = Crawler;