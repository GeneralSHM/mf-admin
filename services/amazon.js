const creads = require('../configs/amazon.api.config');
const request = require('request');

class AmazonApiService{
    constructor() {
        this.changedProducts = [];
    }

    addProduct(product) {
        const currentProduct = this.findProduct(product.MFName);
        console.log("advam:");
        console.log(product);
        // if (currentProduct) {
        //     this.changedProducts[currentProduct.index] = product;
        // } else {
        this.changedProducts.push(product);


        console.log('v momenta imam:');
        console.log(this.changedProducts);
        console.log('v momenta imam:');
        // }
    }

    findProduct(mfName) {
        const products = this.changedProducts;
        let product;

        products.map((product, index) => {
            if (toString(product.MFName) === toString(mfName)) {
                product = {
                    index: index,
                    product: product
                };
            }
        });

        return product;
    }

    sendProductsToApi(){

        console.log('producti::');
        console.log(this.changedProducts);
        console.log('producti::');
        const headers = {
            'User-Agent':       'Super Agent/0.0.1',
            'Content-Type':     'application/x-www-form-urlencoded'
        };

        const options = {
            url: creads.API_BASE_URL,
            method: 'POST',
            headers: headers,
            form: {
                products: this.changedProducts
            }
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log('prati se');
                console.log(body)
            } else {
                console.log('ne se prati');
            }
        })
    }
}

module.exports = AmazonApiService;