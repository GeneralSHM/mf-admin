(function () {
    var TOAST_TIMEOUT = 4000;

    $('.modal').modal();

    var crawlButton = document.querySelector('.manual-crawl');
    crawlButton.addEventListener('click', onCrawlClick);

    $('#crawl-finish').modal({
            complete: function () {
                window.location = '';
            }
        }
    );

    function onCrawlClick(event) {
        $('#loader-container').removeClass('hidden');

        $.post('/crawl', function () {
            $('#loader-container').addClass('hidden');
            $('#crawl-finish').modal('open');
        });
    }


    var createButton = document.querySelector('.add-item');
    createButton.addEventListener('click', onCreateClick);

    var createBrandButton = document.querySelector('.add-brand');
    createBrandButton.addEventListener('click', onCreateBrandClick);

    $('#add-item').modal({
            complete: function () {
                // window.location = '/';
            }
        }
    );

    function onCreateClick(event) {
        $('#add-item').modal('open');
    }


    function onCreateBrandClick(event) {
        $('#add-brand').modal('open');
    }


    $('#add-item-btn').on('click', function () {
        var form = {
            url: $('#addUrl').val(),
            itemName: $('#addItemName').val()
        };

        $.ajax({
            url: '/crawl-item',
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(form)
        }).done(function(response) {
            Materialize.toast(response.message, TOAST_TIMEOUT, 'green lighten-1');

        }).fail(function(error) {
            Materialize.toast(error.responseText, TOAST_TIMEOUT, 'red darken-2');
        });
    });

    $('#add-brand-btn').on('click', function () {
        var form = {
            name: $('#addBrandName').val()
        };

        $.ajax({
            url: '/add-brand',
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(form)
        }).done(function(response) {
            Materialize.toast(response.message, TOAST_TIMEOUT, 'green lighten-1');

            setTimeout(function () {
                window.location = '';
            }, 1000);
        }).fail(function(error) {
            Materialize.toast(error.responseText, TOAST_TIMEOUT, 'red darken-2');
        });
    });

    $('.item-brand-select').on('change', function () {
        if (this.selectedIndex === undefined) {
            return;
        }
        var brandId = $(this.options[this.selectedIndex]).attr('brand-id');
        var itemId = $(this).attr('item-id');
        var data = {
            itemId,
            brandId
        };

        $.ajax({
            url: '/change-item-brand',
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data)
        }).done(function(response) {
            Materialize.toast(response.message, TOAST_TIMEOUT, 'green lighten-1');
        }).fail(function(error) {
            Materialize.toast(error.responseText, TOAST_TIMEOUT, 'red darken-2');
        });
    });

    $('.btn-edit').on('click', function() {
        $('#amazon-name').val($(this).attr('data-amazon-name'));
        $('#amazon-price').val($(this).attr('data-amazon-price'));
        Materialize.updateTextFields();
        $('#edit-item').modal('open');

        var itemId = $(this).attr('data-db-id');

        $('#edit-item-btn').off('click').on('click', function () {
            var form = {
                name: $('#amazon-name').val(),
                price: $('#amazon-price').val()
            };

            $.ajax({
                url: '/crawl-item/' + itemId,
                method: 'PATCH',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(form)
            }).done(function(response) {
                Materialize.toast(response.message, TOAST_TIMEOUT, 'green lighten-1');

                setTimeout(function () {
                    window.location = '';
                }, 1000);

            }).fail(function(error) {
                Materialize.toast(error.responseText, TOAST_TIMEOUT, 'red darken-2');
            });
        });
    });

    $('.upload-item').on('click', function () {
        $('#upload-csv').modal('open');

        $('#upload-item-btn').off('click').on('click', function () {
            $('#loader-container').removeClass('hidden');
            var data = new FormData();
            data.append('csv', $('#upload-input')[0].files[0]);
            $('#upload-csv').modal('close');

            $.ajax({
                url: '/crawl-csv',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                type: 'POST',
                success: function(response){
                    $('#loader-container').addClass('hidden');
                    Materialize.toast(response.message, TOAST_TIMEOUT, 'green lighten-1');

                    if (response.failedItems.length > 0) {
                        displayFailed(response.failedItems);
                    }
                }
            }).fail(function(error) {
                $('#loader-container').addClass('hidden');
                Materialize.toast(error.responseText, TOAST_TIMEOUT, 'red darken-2');
            });
        });
    });

    function displayFailed(failedItems) {
        var failTable = $('#fail-table');

        failTable.empty();

        for (var i = 0; i < failedItems.length; i++) {
            $(failTable).append('<div class="row"><div class="col s12"> ' + (i + 1) + '. <a href="' + failedItems[i].url + '">' + failedItems[i].itemName + '</a></div>');
        }

        $('#upload-fail').modal('open');

    }
})();