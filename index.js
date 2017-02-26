const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

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
    crawler.fetchFrom(req.body.url, req.body.itemName).then((response) => {
        console.log('success', response);
        res.send('Stana');
    }).catch((e) => {
        res.send(e);
    });
});

const PORT = 8080;

app.listen(PORT, function () {
    console.log(`Example app listening on port ${PORT}!`)
});