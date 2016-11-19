const Crawler = require('./Crawler');
let crawler = new Crawler();
let CSVLoader = require('./CSVLoader');
let loader = new CSVLoader();

loader.load('./DEMO_1.csv');

// let url = 'http://www.musiciansfriend.com/accessories/fender-351-premium-celluloid-guitar-picks-12-pack-medium?cntry=us';
// let url = 'http://www.musiciansfriend.com/accessories/ernie-ball-2220-power-slinky-nickel-electric-guitar-strings?cntry=us';

// crawler.fetchFrom(url).then(() => {
//     crawler.listItems();
// }).catch((e) => {
//    console.error(e);
// });


