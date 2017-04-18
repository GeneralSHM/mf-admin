const http = require('http');
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
        return new Promise((resolve, reject) => {
            if (!url.includes('musiciansfriend')) {
                reject('Not MF url!');
                return false;
            }

            http.get(url, (res) => {
                requestHandler(res, resolve, reject);
            }).on('error', (e) => {
                reject(e);
            });
        });
    }
}

module.exports = HttpService;