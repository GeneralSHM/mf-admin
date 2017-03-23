(function () {
    var TOAST_TIMEOUT = 4000;


    $('.modal').modal();

    var crawlButton = document.querySelector('.manual-crawl');
    crawlButton.addEventListener('click', onCrawlClick);

    $('#crawl-finish').modal({
            complete: function () {
                window.location = '/';
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
})();