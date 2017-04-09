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

    var ascendingButton = document.querySelector('.arrow-up');
    ascendingButton.addEventListener('click', function () {
        var currentURL = window.location.href;
        var hasParams = currentURL.indexOf('?') != -1;
        var hasOrder = currentURL.indexOf('order=') != -1;

        if (hasOrder) {
            window.location = currentURL.replace('order=desc', 'order=asc');
        } else if (hasParams) {
            window.location = currentURL + '&order=asc';
        } else {
            window.location = currentURL + '?order=asc';
        }
    });

    var descendingButton = document.querySelector('.arrow-down');
    descendingButton.addEventListener('click', function () {
        var currentURL = window.location.href;
        var hasParams = currentURL.indexOf('?') != -1;
        var hasOrder = currentURL.indexOf('order=') != -1;

        if (hasOrder) {
            window.location = currentURL.replace('order=asc', 'order=desc');
        } else if (hasParams) {
            window.location = currentURL + '&order=desc';
        } else {
            window.location = currentURL + '?order=desc';
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
})();