const http = require('http');
const https = require('https');
const Promise = require('bluebird');

let requestHandler = (res, resolve, reject) => {
    const statusCode = res.statusCode;
    let error;

    if (statusCode !== 200) {
        error = {
            message: `Request Failed.\n` + `Status Code: ${statusCode}`,
            statusCode: statusCode,
            location: res.headers.location
        };
    }

    if (error) {
        reject(error);
        // consume response data to free up memory
        res.resume();
        return;
    }

    res.setEncoding('utf8');
    let rawData = '';

    res.on('data', (chunk) => {
        rawData += chunk;
    });
    res.on('end', () => {
        resolve(rawData);
    });
};

class HttpService {
    get(url) {
        const urlForParse = 'http://212.237.24.65:8080/get-data';
        return new Promise((resolve, reject) => {
            if (!url.includes('musiciansfriend')) {
                reject('Not MF url!');
                return false;
            }

            var options = {
                "method": "POST",
                "hostname": "212.237.24.65",
                "port": "8080",
                "path": "/get-data",
                "headers": {
                    "content-type": "application/json"
                }
            };

            var req = http.request(options, function (res) {
                requestHandler(res, resolve, reject);
            }).on('error', (e) => {
                reject(e);
            });

            req.write(JSON.stringify({ urls: [ url ] }));
            req.end();

            // let isHttp = url.indexOf('https') === -1;
            // if (isHttp) {
            //     http.get(url, (res) => {
            //         requestHandler(res, resolve, reject);
            //     }).on('error', (e) => {
            //         reject(e);
            //     });
            // } else {
            //     https.get(url, (res) => {
            //         requestHandler(res, resolve, reject);
            //     }).on('error', (e) => {
            //         reject(e);
            //     });
            // }
        });
    }
}

module.exports = HttpService;