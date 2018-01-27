const BrandRepository = require('../repositories/BrandRepository');

class BrandingSerivce{
    constructor(connection) {
        this.brandRepo = new BrandRepository(connection);
    }

    /**
     *
     * @param name
     * @return {boolean}
     */
    createBrand(name){
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
            if (brand.id == brandId) {
                return brand;
            }
        }

        return false;
    }
}

module.exports = BrandingSerivce;