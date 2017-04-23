const HOUR = 3600 * 1000; //ms

module.exports = {
    PROJECT_NAME: 'Music Crawler',
    CRAWL_INTERVAL: 4 * HOUR,
    PORT: 8080,
    TIMEOUT_STEP: 150 //ms - crawl request timeout
};