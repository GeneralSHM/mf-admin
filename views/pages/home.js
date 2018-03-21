const ItemRepository = require('../../repositories/ItemRepository');
const BrandRepo = require('../../repositories/BrandRepository');
const BrandService = require('../../services/branding');
const View = require('../view');

class HomeView {
    constructor(connection, request) {
        this.itemRepository = new ItemRepository(connection);
        this.brandRepo = new BrandRepo(connection);
        this.pageCount = null;
        this.currentPage = typeof request.query.page != 'undefined' && !isNaN(parseInt(request.query.page)) && parseInt(request.query.page) >= 1 ? parseInt(request.query.page) - 1 : 0;
        this.shouldSearch = typeof request.query.search != 'undefined';
        this.searchParam = request.query.search;
        if (this.searchParam) {
            this.searchParam = this.searchParam.trim();
        }
        this.brandFilterIds = [];
        if (request.query.brand) {
            this.brandFilterIds = request.query.brand.split(',').map((brand) => parseInt(brand));
        }

        this.brandService = new BrandService(connection);
        this.brands = null;

        this.sortOrder = typeof request.query.order == 'string' && request.query.order.toUpperCase() == 'ASC' ? 'ASC' : 'DESC';
        this.sortBy = typeof request.query.filter == 'string' && request.query.filter.toLowerCase() == 'status' ? 'status' : 'modified';

        let queryListSize = parseInt(request.query.listSize);

        this.itemsPerPage = typeof request.query.listSize != 'undefined' && !isNaN(queryListSize) && queryListSize >= 1 ? queryListSize : 50;
        this.query = request.query;
    }

    getTable(items, brands) {
        let tableRows = '';

        for (let item of items) {
            let brandForItem = this.brandService.getBrandById(item.brand_id, brands);
            let optionsForBrands = '';
            let selectedForDisabled = "selected";
            for (let brand of brands) {
                let selected = (brandForItem !== false && parseInt(brandForItem.id) === parseInt(brand.id)) ? 'selected' : '';
                if (selected !== '') {
                    selectedForDisabled = '';
                }
                optionsForBrands += `<option brand-id="${brand.id}" ${selected}>${brand.name}</option>`;
            }

            tableRows += `
                <tr class="${item.is_url_active ? '' : 'broken-link'}">
                    <td class="img-col"><img class="circle responsive-img" src="${item.thumbnail}" alt="${item.mf_name}"></td>
                    <td>${item.mf_name}</td>
                    <td>${item.price}$</td>
                    <td class="${item.diff > 0 ? 'red darken-1' : item.diff < 0 ? 'green lighen-1' : ''}">${item.diff > 0 ? `+${item.diff}` : item.diff}$</td>
                    <td>${item.amazon_name == '' ? 'Not set' : item.amazon_name}</td>
                    <td>${item.amazon_price}$</td>
                    <td class="center-align">
                        <div class="chip item-availability ${item.availability == 'in_stock' ? 'light-green accent-3' : 'pink accent-3'}">
                            ${item.availability == 'in_stock' ? 'Available' : 'Unavailable'}
                        </div>
                    </td>
                    <td><a href="${item.url}" target="_blank" class="waves-effect waves-light btn">${item.is_url_active ? 'Open MF' : 'BROKEN LINK!'}</a></td>
                    <td>
                        <select class="item-brand-select" item-id="${item.item_id}">
                          <option value="" disabled ${selectedForDisabled}>Brand</option>
                          <option value="0">No brand</option>
                          ${optionsForBrands}
                        </select>  
                    </td>
                    <td>${(new Date(item.date_added)).toLocaleString()}</td>
                    <td>${(new Date(item.last_change)).toLocaleString()}</td>
                    <td><p class="input-field"><input item-id="${item.item_id}" class="send-to-amazon-checkbox" id="send-to-amazon-checkbox-id${item.item_id}" type="checkbox" ${item.send_to_amazon === 1 ? "checked" : ''}/><label for="send-to-amazon-checkbox-id${item.item_id}"></label></p></td>
                    <td><i class="material-icons btn-edit" data-amazon-name="${item.amazon_name}" data-amazon-price="${item.amazon_price}" data-db-id="${item.item_id}">mode_edit</i></td>
                    <td><i class="material-icons btn-delete" data-name="${item.mf_name}" data-db-id="${item.item_id}">delete</i></td>
                </tr>
            `;
        }

        return ` 
            <table class="responsive-table striped">
                <thead>
                    <tr>
                        <th data-field="thumbnail">Thumbnail</th>
                        <th data-field="id">MusicFriend name</th>
                        <th data-field="mf-price">MusicFriend price</th>
                        <th data-field="mf-price-delta">Price change</th>
                        <th data-field="name">Amazon Name</th>
                        <th data-field="price">Amazon Price</th>
                        <th class="center-align" data-field="availability"><span>Availability</span><div><span class="arrow-down status"></span><span class="arrow-up status"></span></div></th>
                        <th data-field="link">Link</th>
                        <th data-field="brand">Brand</th>
                        <th data-field="date-added">Added on</th>
                        <th data-field="date-scraped"><span>Last change</span><div><span class="arrow-down modify"></span><span class="arrow-up modify"></span></div></th>
                        <th data-field="remove-from-amazon"><p><input id="send-to-amazon-checkbox-all" type="checkbox"/><label for="send-to-amazon-checkbox-all">Amazon API</label></p></th>
                        <th data-field="edit"></th>
                        <th data-field="delete"></th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    }

    getPagination() {
        try {
            var queryParams = JSON.parse(JSON.stringify(this.query));
        } catch (e) {
            queryParams = {};
        }

        let pages = '';

        for (let i = 0; i < this.pageCount; i++) {
            queryParams.page = i + 1;
            pages += `<li class="${i == this.currentPage ? 'active' : 'waves-effect'}"><a href="/${View.queryToString(queryParams)}">${i + 1}</a></li>`;
        }

        return `<ul class="pagination center-align">
                   ${pages}
                </ul>`;
    }

    getItemPage() {
        return new Promise((resolve, reject) => {
            let method = this.shouldSearch ? 'getByName' : 'getItemPage';

            this.brandRepo.getAllBrands().then((brands) => {
                this.brands = brands;
                this.itemRepository[method](this.currentPage, this.itemsPerPage, this.searchParam, this.sortOrder, this.sortBy, this.brandFilterIds).then((items) => {
                    resolve(`
                    ${this.getTable(items, brands)}
                    ${this.getPagination()}
                    <script>
                        window.j = ${JSON.stringify(items)}
                    </script>
                `);
                }).catch((e) => {
                    reject(e);
                });
            }).catch((e) => {
                reject(e);
            });
        });
    }

    fillTemplate(table) {
        var optionsForBrands = '';
        var optionsForSelectedBrands = '';
        var selected = 'selected';
        for (let brand of this.brands) {
            if (this.brandFilterIds.indexOf(brand.id) !== -1) {
                optionsForSelectedBrands += `<option value="${brand.id}" ${selected}>${brand.name}</option>`;
            } else {
                optionsForBrands += `<option value="${brand.id}">${brand.name}</option>`;
            }
        }
        return `
            <div class="row">
                <div class="search-field input-field z-depth-1">
                    <input id="search" type="search" required>
                    <label class="label-icon" for="search"><i class="material-icons">search</i></label>
                    <i class="material-icons close-icon">close</i>
                </div>
            </div>
            <div class="row">
                <div class="input-field col s2">
                    <select id="list-size">
                      <option value="50" ${this.itemsPerPage == 50 ? 'selected' : ''}>50</option>
                      <option value="100" ${this.itemsPerPage == 100 ? 'selected' : ''}>100</option>
                      <option value="200" ${this.itemsPerPage == 200 ? 'selected' : ''}>200</option>
                    </select>
                    <label>Items per page</label>
                </div>
                <div class="input-field col s4">
                    <div class="row">
                        <select class="browser-default" multiple id="brand-filter-select">
                          <option value="" disabled selected>Choose your option</option>
                          <option value="0" ${this.brandFilterIds.indexOf(0) !== -1 ? 'selected' : ''}>No brand</option>
                          ${optionsForSelectedBrands}
                          ${optionsForBrands}
                        </select>
                    </div>
                    <div class="row input-field"><a id="filter-by-brand-button" class="waves-effect waves-light btn">Filter</a></div>
                </div>
            </div>
            ${table}
        `;
    }

    compile() {
        return new Promise((resolve, reject) => {
            this.itemRepository.getItemPageCount(this.itemsPerPage, this.searchParam, this.brandFilterIds).then((count) => {
                this.pageCount = count;
                this.getItemPage().then((table) => {
                    resolve(this.fillTemplate(table));
                }).catch((e) => {
                    reject(e);
                });
            }).catch((e) => {
                reject(e);
            });
        });
    }
}

module.exports = HomeView;
