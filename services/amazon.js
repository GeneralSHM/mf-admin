const creads = require('../configs/amazon.api.config');
const request = require('request');
const axios = require('axios');

class AmazonApiService{
    constructor() {
        this.changedProducts = [];
    }

    addProduct(product) {
        const currentProduct = this.findProduct(product.MFName);
        this.changedProducts.push(product);
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

    generateNewReportId() {
        let axiosConfig = {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                "Access-Control-Allow-Origin": "*",
            }
        };

        return axios.get(creads.API_BASE_URL + 'new-report');
    }

    sendProductsToApi(){}

    sendProductsToApii(items, reportId){
        var postData = {
            items: items,
            reportId: reportId
        };

        let axiosConfig = {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                "Access-Control-Allow-Origin": "*",
            }
        };

        axios.post(creads.API_BASE_URL + 'update-quantities', postData, axiosConfig)
            .then((res) => {
                if (res.data === false) {
                    setTimeout(() => {
                        this.sendProductsToApii(items, reportId);
                    }, 600000);
                }
            })
            .catch((err) => {
                console.log("AXIOS ERROR: ", err);
            })
    }
}

module.exports = AmazonApiService;