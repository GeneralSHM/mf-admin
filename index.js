const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressValidator = require('express-validator');
var session = require('express-session');
var csv = require('express-csv');

const amazon = require('./services/amazon');
var asd = new amazon();
asd.sendProductsToApi();
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
const BrandingService = require('./services/branding');
const ItemRepository = require('./repositories/ItemRepository');

const mysql = new MySQL();
const view = new View(mysql.connection);
const crawler = new Crawler(mysql.connection);
const brandingService = new BrandingService(mysql.connection);
const ItemRepo = new ItemRepository(mysql.connection);

app.use(cookieParser());
app.use(session({
    secret: 'work hard',
    resave: true,
    saveUninitialized: false
}));

/*
Helper Functions
*/
function authenticate(name, pass, fn) {
    if (!module.parent) console.log('authenticating %s:%s', name, pass);

    if (name == MainConfig.ADMIN_NAME && pass == MainConfig.ADMIN_PASS) {
        return fn(null, true);
    } else {
        fn(new Error('invalid password'));
    }
}

function requiredAuthentication(req, res, next) {
    next();
    return;
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(expressValidator());

app.get('/', requiredAuthentication, function (req, res) {
    view.render('home', req).then((data) => {
        res.send(data);
    }).catch((e) => {
        res.send(e);
    });
});

app.post('/crawl', function (req, res) {
    MainConfig.IS_CRAWLING = true;
    crawler.fetchFromDB().then(() => {
        MainConfig.IS_CRAWLING = false;
        res.send({});
    }).catch((e) => {
        MainConfig.IS_CRAWLING = false;
        res.send(e);
    });
});

app.post('/add-brand', function (req, res) {
    console.log('BODY:', req.body);
    if (!req.body.name) {
        res.status(500).send("Name is required");
    } else {
        try {
            brandingService.createBrand(req.body.name).then((response) => {
                console.log('Added/Updated: ', response);
                res.status(200).send({
                    message: 'Brand successfully added!'
                });
            }).catch((e) => {
                console.log('tuk');
                res.status(400).send(JSON.stringify(e));
            });
        } catch (e) {
            console.log('tuk1');
            res.status(500).send(JSON.stringify(e));
        }
    }
});

app.post('/crawl-item', function (req, res) {
    try {
        crawler.fetchFrom(Crawler.formatUrl(req.body.url), req.body.itemName, '', true).then((response) => {
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

app.post('/change-item-brand', function (req, res) {
    try {
        ItemRepo.updateItemBrand(req.body.itemId, req.body.brandId).then(() => {
            res.status(200).send({
                message: "Brand changed."
            });
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



app.get("/login", function (req, res) {
    view.render("login", req).then((data) => {
        res.send(data);
    }).catch((e) => {
        res.send(e);
    });
});

app.post("/login", function (req, res) {
    console.log(req.body);
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {

            req.session.regenerate(function () {
                req.session.user = user;
                res.send({success: true});
            });
        } else {
            req.session.error = 'Authentication failed, please check your ' + ' username and password.';
            res.send({success: false});
        }
    });
});

app.get('/csv-export', function (req, res) {
    ItemRepo.getItemsForCsvExport().then((items) => {
        var csvData = [['Name', 'Url', 'SKU' , 'Brand']];
        for(let item of items) {
            csvData.push([item.name, item.url, item.sku, item.brand]);
        }
        res.csv(csvData);
    });
});

app.listen(MainConfig.PORT, function () {
    console.log(`${MainConfig.PROJECT_NAME} listening on port ${MainConfig.PORT}!`);
});

/*
* Auto crawling
* */
setInterval(() => {
    MainConfig.IS_CRAWLING = true;
    crawler.fetchFromDB().then(() => {
        console.log(`Crawl finished at: ${Date.now()}`);
        MainConfig.IS_CRAWLING = false;

    }).catch(() => {
        console.error(`Crawl failed at: ${Date.now()}`);
        MainConfig.IS_CRAWLING = false;
    });

}, MainConfig.CRAWL_INTERVAL);
