module.exports = `
    <!--Import jQuery before materialize.js-->
    <script type="text/javascript" src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
    <!--<script type="text/javascript" src="js/materialize.min.js"></script>-->
    <!-- Compiled and minified JavaScript -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.98.0/js/materialize.min.js"></script>
    <!-- JS -->
    <script src="/js/search.js"></script>
    <script src="/js/modals.js"></script>
    <script>
    (function($) {
        $(function() {
            $('#login-form').on('submit', function (e) {
                e.preventDefault();
                var unindexed_array = $('#login-form').serializeArray();
                var indexed_array = {};
            
                $.map(unindexed_array, function(n, i){
                    indexed_array[n['name']] = n['value'];
                });
    
                $.ajax({
                    url: '/login',
                    method: 'POST',
                    contentType: 'application/json',
                    dataType: 'json',
                    data: JSON.stringify(indexed_array)
                }).done(function(response) {
                    if (response.success == true) {
                        window.location = '/';
                    } else {
                        $('#error')[0].innerHTML = 'Wrong username / password';
                    }
                }).fail(function(error) {
                });
            });
        });
    })(jQuery);
    </script>
`;