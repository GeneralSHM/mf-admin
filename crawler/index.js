const Crawler = require('./Crawler');
let crawler = new Crawler();


crawler.scrapeCSV('./DEMO_1.csv').then(() => {

}).catch((error) => {
    throw new Error(error);
});