const mysql = require('mysql');
const Cred = require('../configs/db.config');

class MySQL {
    constructor() {
        this.connection = mysql.createConnection({
            host: Cred.HOST,
            database: Cred.DATABASE,
            user: Cred.USER,
            password: Cred.PASSWORD
        });
    }
}

module.exports = MySQL;