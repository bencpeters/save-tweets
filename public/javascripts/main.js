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
                    } else if ((field = $('select[name=' + k + ']')).length > 0) {
                        field.val(v);
                    }
                });
            }
        });
    }

    var reloadStatus = function() {
        $.ajax("/process/status.json", {
            error: function(jqXHR, textStatus, err) {
                alert("Error loading process status: " + err);
            },
            success: function(data) {
                var statusBlock = $('#process-status');
                if (data.running) {
                    statusBlock.text("Running");
                    statusBlock.addClass("running");
                    statusBlock.removeClass("stopped");
                } else {
                    statusBlock.text("Stopped");
                    statusBlock.addClass("stopped");
                    statusBlock.removeClass("running");
                }
            },
            type: "GET"
        });
    };

    $('#process-control button').click(function(obj) {
        var path;
        if ($(this).attr('id') === 'stop') path = '/process/stop';
        if ($(this).attr('id') === 'restart') path = '/process/restart';
        if ($(this).attr('id') === 'start') path = '/process/start';

        $.ajax(path, {
            error: function(jqXHR, textStatus, err) {
                alert("Error processing request to " + path + ": " + err);
            },
            success: function(data) {
                reloadStatus();
            },
            type: "POST"
        });
    });

    reloadStatus();
    setInterval(reloadStatus, 10000);
});
