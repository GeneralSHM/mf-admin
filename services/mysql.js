const mysql = require('mysql');

class MySQL {
    constructor() {
        this.connection = mysql.createConnection({
            host: '127.0.0.1',
            database: 'music_crawler',
            user: 'root',
            password: 'kokoboko'
        });
    }
}

module.exports = MySQL;