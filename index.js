const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer  = require('multer');
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        let filePortions = file.originalname.split('.');
        let extension = filePortions[filePortions.length - 1];

        cb(null, file.fieldname + '-' + Date.now() + '.' + extension);
    }
});

const upload = multer({ storage: storage });

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
       crawler.fetchFrom(Crawler.formatUrl(req.body.url), req.body.itemName).then((response) => {
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

app.patch('/crawl-item/:id', function (req, res) {
    try {
        crawler.editItem(req.params.id, {
            amazon_name: req.body.name,
            amazon_price: req.body.price
        }).then(() => {
            res.status(200).send({
                message: 'Item successfully updated!'
            });
        }).catch((error) => {
            res.status(400).send(JSON.stringify(error));
        });
    } catch (e) {
        res.status(500).send(JSON.stringify(e));
    }
});

app.post('/crawl-csv', upload.single('csv'), function (req, res, next) {
    let filePath = path.resolve(__dirname, req.file.destination, req.file.filename);

    crawler.scrapeCSV(filePath).then((failedItems) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send(err);
            } else {
                console.log(`Successfully parsed and deleted: ${filePath}`);
                res.status(200).send({
                    message: 'CSV successfully parsed!',
                    failedItems: failedItems
                });
            }
        });
    }).catch((e) => {
        console.error(e);
        res.status(400).send(e);

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`Successfully deleted: ${filePath}`);
            }
        });
    });
});

app.listen(MainConfig.PORT, function () {
    console.log(`${MainConfig.PROJECT_NAME} listening on port ${MainConfig.PORT}!`);
});

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
