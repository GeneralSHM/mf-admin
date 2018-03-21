const HOUR = 3600 * 1000; //ms

module.exports = {
    PROJECT_NAME: 'Music Crawler',
    CRAWL_INTERVAL: 4 * HOUR,
    PORT: 4200,
    IS_CRAWLING: false,
    ADMIN_NAME: 'admin',
    ADMIN_PASS: 'admin',
    TIMEOUT_STEP: 150 //ms - crawl request timeout
};
