let path = require('path');

let navigation = require(path.join(__dirname, 'partials/navigation'));
let head = require(path.join(__dirname, 'partials/head'));
let scripts = require(path.join(__dirname, 'partials/scripts'));

class View {
    constructor(dbConnection) {
        this.dbConnection = dbConnection;
    }

    static queryToString(params) {
        let query = '?';
        for (var key in params) {
            query += key + '=' + params[key] + '&';
        }
        query = query.substr(0, query.length - 1);

        return query;
    }

    render(view, request) {
        return new Promise((resolve, reject) => {
            const currentViewClass = require(path.join(__dirname, `pages/${view}`));
            let currentView = new currentViewClass(this.dbConnection, request);

            currentView.compile().then((result) => {
                resolve(`
                    <!DOCTYPE html>
                    <html lang="en">
                    ${head}
                    <body>
                        ${navigation}
                        <div class="view">
                            ${result}
                        </div>
                        ${scripts}
                    </body>
                    </html>
                `);
            }).catch((e) => {
                reject(e);
            });
        });
    }
}

module.exports = View;