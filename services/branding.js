const BrandRepository = require('../repositories/BrandRepository');

class BrandingSerivce {
    constructor(connection) {
        this.brandRepo = new BrandRepository(connection);
    }

    /**
     *
     * @param name
     * @return {boolean}
     */
    createBrand(name) {
        if (toString(name) === '' || !name) {
            return false;
        }

        return this.brandRepo.addBrand(name);
    }

    /**
     *
     * @param brandId
     * @param brands
     * @return {*}
     */
    getBrandById(brandId, brands) {
        for (let brand of brands) {
            if (parseInt(brand.id) === parseInt(brandId)) {
                return brand;
            }
        }

        return false;
    }

    insertNonExistingBrandsByName(items) {
        var promises = [];
        for (let item of items) {
            promises.push(this.brandRepo.addBrand(item.brand).then(() => {
                return this.brandRepo.getBrandByName(item.brand).then((brand) => {
                    item.brandID = brand[0].id;
                    return item;
                });
            }));
        }

        return new Promise((resolve, reject) => {
            Promise.all(promises).then((itemss) => {
                resolve(itemss);
            }).catch((error) => {
                reject(error);
            })
        });
    }
}

module.exports = BrandingSerivce;