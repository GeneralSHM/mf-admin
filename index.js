const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const MainConfig = require('./configs/main.config');

const View = require('./views/view');
const MySQL = require('./services/mysql');

const Crawler = require('./crawler/Crawler');

const mysql = new MySQL();
const view = new View(mysql.connection);
const crawler = new Crawler(mysql.connection);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    view.render('home', req).then((data) => {
        res.send(data);
    }).catch((e) => {
        res.send(e);
    });
});

app.post('/crawl', function (req, res) {
    crawler.fetchFromDB().then(() => {
        res.send({});
    }).catch((e) => {
        res.send(e);
    });
});

app.post('/crawl-item', function (req, res) {
   try {
       crawler.fetchFrom(req.body.url, req.body.itemName).then((response) => {
           console.log('Added/Updated: ', response);
           res.status(200).send({
               message: 'Item successfully added!'
           });
       }).catch((e) => {
           res.status(400).send(JSON.stringify(e));
       });
   } catch (e) {
       res.status(500).send(JSON.stringify(e));
   }
});

app.delete('/crawl-item/:id', function (req, res) {
    try {
        crawler.deleteItem(req.params.id).then(() => {
            res.status(200).send({
                message: 'Item successfully removed!'
            });
        }).catch((error) => {
            res.status(400).send(JSON.stringify(error));
        });
    } catch (e) {
        res.status(500).send(JSON.stringify(e));
    }
});

app.listen(MainConfig.PORT, function () {
    console.log(`Example app listening on port ${MainConfig.PORT}!`);
});

// crawler.scrapeCSV('./crawler/DEMO_1.csv').then(() => {
//     console.log('CSV fully parsed');
// }).catch((e) => {
//     console.error(e);
// });

/*
* Auto crawling
* */
setInterval(() => {
    crawler.fetchFromDB().then(() => {
        console.log(`Crawl finished at: ${Date.now()}`);

    }).catch(() => {
        console.error(`Crawl failed at: ${Date.now()}`);
    });

}, MainConfig.CRAWL_INTERVAL);
