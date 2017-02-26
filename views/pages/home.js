const ItemRepository = require('../../repositories/ItemRepository');
const View = require('../view');

class HomeView {
    constructor(connection, request) {
        this.itemRepository = new ItemRepository(connection);
        this.itemsPerPage = 10;
        this.pageCount = null;
        this.currentPage = typeof request.query.page != 'undefined' && !isNaN(parseInt(request.query.page)) && parseInt(request.query.page) >= 1 ? parseInt(request.query.page) - 1 : 0;
        this.shouldSearch = typeof request.query.search != 'undefined';
        this.searchParam = request.query.search;
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
                    <td>${item.amazon_name == '' ? 'Not set' : item.amazon_name}</td>
                    <td>${item.amazon_price}</td>
                    <td class="center-align">
                        <div class="chip item-availability ${item.availability == 'in_stock' ? 'light-green accent-3' : 'pink accent-3'}">
                            ${item.availability == 'in_stock' ? 'Available' : 'Unavailable'}
                        </div>
                    </td>
                    <td><a href="${item.url}" target="_blank" class="waves-effect waves-light btn">Open MF</a></td>
                    <td>${(new Date(item.date_added)).toLocaleString()}</td>
                    <td>${(new Date(item.last_crawl)).toLocaleString()}</td>
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
                        <th data-field="name">Amazon Name</th>
                        <th data-field="price">Amazon Price</th>
                        <th class="center-align" data-field="availability">Availability</th>
                        <th data-field="link">Link</th>
                        <th data-field="date-added">Added on</th>
                        <th data-field="date-scraped">Last scraped</th>
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

            this.itemRepository[method](this.currentPage, this.itemsPerPage, this.searchParam).then((result) => {
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