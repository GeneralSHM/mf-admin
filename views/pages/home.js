const ItemRepository = require('../../repositories/ItemRepository');
const View = require('../view');

class HomeView {
    constructor(connection, request) {
        this.itemRepository = new ItemRepository(connection);
        this.pageCount = null;
        this.currentPage = typeof request.query.page != 'undefined' && !isNaN(parseInt(request.query.page)) && parseInt(request.query.page) >= 1 ? parseInt(request.query.page) - 1 : 0;
        this.shouldSearch = typeof request.query.search != 'undefined';
        this.searchParam = request.query.search;

        this.sortOrder = typeof request.query.order == 'string' && request.query.order.toUpperCase() == 'DESC' ? 'DESC' : 'ASC';

        let queryListSize = parseInt(request.query.listSize);

        this.itemsPerPage = typeof request.query.listSize != 'undefined' && !isNaN(queryListSize) && queryListSize >= 1 ? queryListSize : 50;
        this.query = request.query;
    }

    getTable(items) {
        let tableRows = '';

        for (let item of items) {
            tableRows += `
                <tr>
                    <td class="img-col"><img class="circle responsive-img" src="${item.thumbnail}" alt="${item.mf_name}"></td>
                    <td>${item.mf_name}</td>
                    <td>${item.price}$</td>
                    <td class="${item.diff > 0 ? 'red darken-1' : item.diff < 0 ? 'green lighen-1' : ''}">${item.diff > 0 ? `+${item.diff}` : item.diff}$</td>
                    <td>${item.amazon_name == '' ? 'Not set' : item.amazon_name}</td>
                    <td>${item.amazon_price}</td>
                    <td class="center-align">
                        <div class="chip item-availability ${item.availability == 'in_stock' ? 'light-green accent-3' : 'pink accent-3'}">
                            ${item.availability == 'in_stock' ? 'Available' : 'Unavailable'}
                        </div>
                    </td>
                    <td><a href="${item.url}" target="_blank" class="waves-effect waves-light btn">Open MF</a></td>
                    <td>${(new Date(item.date_added)).toLocaleString()}</td>
                    <td>${(new Date(item.last_change)).toLocaleString()}</td>
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
                        <th class="center-align" data-field="availability">Availability</th>
                        <th data-field="link">Link</th>
                        <th data-field="date-added">Added on</th>
                        <th data-field="date-scraped"><span>Last change</span><span class="arrow-down"></span><span class="arrow-up"></span></th>
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
        console.log(this.itemsPerPage);

        return new Promise((resolve, reject) => {
            let method = this.shouldSearch ? 'getByName' : 'getItemPage';

            this.itemRepository[method](this.currentPage, this.itemsPerPage, this.searchParam, this.sortOrder).then((result) => {
                resolve( `
                    ${this.getTable(result)}
                    ${this.getPagination()}
                    <script>
                        window.j = ${JSON.stringify(result)}
                    </script>
                `);
            }).catch((e) => {
                reject(e);
            });
        });
    }

    fillTemplate(table) {
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
                    ${table}
                `;
    }

    compile() {
        return new Promise((resolve, reject) => {
            this.itemRepository.getItemPageCount(this.itemsPerPage, this.searchParam).then((count) => {
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