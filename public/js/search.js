(function () {
    var TOAST_TIMEOUT = 4000;
    var ENTER = 13;

    $('select').material_select();

    $('#list-size').change(function () {
        window.location = '/?listSize=' + $(this).val();
    });


    var search = document.getElementById('search');
    search.addEventListener('keyup', onEnter);

    var queryParams = window.location.search != '' ? window.location.search.replace('?', '').split('&').reduce(function (accumulator, currentValue) {
        var itemArray = currentValue.split('=');
        accumulator[itemArray[0]] = itemArray[1];
        return accumulator;
    }, {}) : {};

    function queryToString(params) {
        let query = '?';
        for (var key in params) {
            if (key != 'page') {
                query += key + '=' + params[key] + '&';
            }
        }
        query = query.substr(0, query.length - 1);

        return query;
    }

    search.value = typeof queryParams.search != 'undefined' ? decodeURIComponent(queryParams.search) : '';

    function onEnter(event) {
        if (event.keyCode == ENTER) {
            queryParams.search = event.target.value;
            window.location = queryToString(queryParams);
        }
    }

    var ascendingModifyButton = document.querySelector('.arrow-up.modify');
    ascendingModifyButton.addEventListener('click', function () {
        var currentURL = window.location.href;
        var hasParams = currentURL.indexOf('?') != -1;
        var hasOrder = currentURL.indexOf('order=') != -1;

        if (hasOrder) {
            window.location = currentURL.replace('order=desc', 'order=asc').replace('filter=status', 'filter=modified');
        } else if (hasParams) {
            window.location = currentURL + '&order=asc&filter=modified';
        } else {
            window.location = currentURL + '?order=asc&filter=modified';
        }
    });

    var descendingModifyButton = document.querySelector('.arrow-down.modify');
    descendingModifyButton.addEventListener('click', function () {
        var currentURL = window.location.href;
        var hasParams = currentURL.indexOf('?') != -1;
        var hasOrder = currentURL.indexOf('order=') != -1;

        if (hasOrder) {
            window.location = currentURL.replace('order=asc', 'order=desc').replace('filter=status', 'filter=modified');
        } else if (hasParams) {
            window.location = currentURL + '&order=desc&filter=modified';
        } else {
            window.location = currentURL + '?order=desc&filter=modified';
        }
    });

    var ascendingStatusButton = document.querySelector('.arrow-up.status');
    ascendingStatusButton.addEventListener('click', function () {
        var currentURL = window.location.href;
        var hasParams = currentURL.indexOf('?') != -1;
        var hasOrder = currentURL.indexOf('order=') != -1;

        if (hasOrder) {
            window.location = currentURL.replace('order=desc', 'order=asc').replace('filter=modified', 'filter=status');
        } else if (hasParams) {
            window.location = currentURL + '&order=asc&filter=status';
        } else {
            window.location = currentURL + '?order=asc&filter=status';
        }
    });

    var descendingStatusButton = document.querySelector('.arrow-down.status');
    descendingStatusButton.addEventListener('click', function () {
        var currentURL = window.location.href;
        var hasParams = currentURL.indexOf('?') != -1;
        var hasOrder = currentURL.indexOf('order=') != -1;

        if (hasOrder) {
            window.location = currentURL.replace('order=asc', 'order=desc').replace('filter=modified', 'filter=status');
        } else if (hasParams) {
            window.location = currentURL + '&order=desc&filter=status';
        } else {
            window.location = currentURL + '?order=desc&filter=status';
        }
    });

    $("#filter-by-brand-button").on('click', function () {
        var selectedBrands = $('select.SumoUnder')[0].sumo.getSelStr().substr(1);

        var currentURL = window.location.href;
        var hasParams = currentURL.indexOf('?') != -1;
        var hasBrand = currentURL.indexOf('brand') != -1;

        if (hasBrand) {
            window.location = currentURL.replace(/brand=[\d*,]*/g, 'brand=' + selectedBrands);
        } else if (hasParams) {
            window.location = currentURL + "&brand=" + selectedBrands;
        } else {
            window.location = currentURL + "?brand=" + selectedBrands;
        }
    });

    $("#filter-by-price-button").on('click', function () {
        var priceFrom = $('#priceFrom').val();
        var priceTo = $('#priceTo').val();

        var currentURL = window.location.href;
        var hasParams = currentURL.indexOf('?') != -1;
        var hasPrice = currentURL.indexOf('priceFrom=') != -1;

        if (hasPrice) {
            window.location = currentURL.replace(/priceFrom=.*\&afr/g, 'priceFrom=' + priceFrom + '&priceTo=' + priceTo + '&afr');
        } else if (hasParams) {
            window.location = currentURL + '&priceFrom=' + priceFrom + '&priceTo=' + priceTo + '&afr';
        } else {
            window.location = currentURL + '?priceFrom=' + priceFrom + '&priceTo=' + priceTo + '&afr';
        }
    });

    $('.btn-delete').on('click', function () {
        var isConfirmed = window.confirm('Are you sure you want to delete ' + $(this).attr('data-name') + ' ?');

        if (isConfirmed) {
            $.ajax({
                url: '/crawl-item/' + $(this).attr('data-db-id'),
                method: 'DELETE',
                contentType: 'application/json',
                dataType: 'json'
            }).done(function(response) {
                Materialize.toast(response.message, TOAST_TIMEOUT, 'green lighten-1');

                setTimeout(function () {
                    window.location = '';
                }, 1000);

            }).fail(function(error) {
                Materialize.toast(error.responseText, TOAST_TIMEOUT, 'red darken-2');
            });

        }
    });

    $('select').on('contentChanged', function() {
        // re-initialize (update)
        $(this).material_select();
    });

    $( document ).ready(function() {
        $('#brand-filter-select').SumoSelect({search: true, searchText: 'Enter here.'});
    });
})();