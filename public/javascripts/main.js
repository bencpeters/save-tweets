$(document).ready(function() {
    var form = $('form#main-options');
    if (form.length > 0) {
        $.ajax("/settings.json", {
            type: "GET",
            error: function(jqXHR, textStatus, err) {
                alert("Error getting options: " + err);
            },
            success: function(data) {
                $.each(data, function(k, v) {
                    var field = $('input[name=' + k + ']');
                    if (field.length > 0) {
                        field.val(v);
                    }
                });
            }
        });
    }
});
