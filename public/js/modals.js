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

    $('#add-item').modal({
            complete: function () {
                // window.location = '/';
            }
        }
    );

    function onCreateClick(event) {
        $('#add-item').modal('open');
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
})();