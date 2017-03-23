(function() {
    var ENTER = 13;

    $('select').material_select();

    $('#list-size').change(function(){
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
})();