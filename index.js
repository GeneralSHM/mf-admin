const path = require('path');
const express = require('express');
const app = express();

const View = require('./views/view');
const MySQL = require('./services/mysql');

const mysql = new MySQL();
const view = new View(mysql.connection);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    view.render('home', req).then((data) => {
        res.send(data);
    }).catch((e) => {
        res.send(e);
    });
});

const PORT = 8080;

app.listen(PORT, function () {
    console.log(`Example app listening on port ${PORT}!`)
});