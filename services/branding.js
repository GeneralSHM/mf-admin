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
}

module.exports = BrandingSerivce;