String.prototype.hashCode = function(){
    if (Array.prototype.reduce){
        return this.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);              
    } 
    var hash = 0;
    if (this.length === 0) return hash;
    for (var i = 0; i < this.length; i++) {
        var character  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

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

function updateTweets(tweets) {
    var tweetList = $('.tweet-list');
    var desiredIdList = {};
    var existingIdList = {};
    $.each(tweets, function(i, tweet) {
        var id = (tweet.ts + tweet.tweet.text).hashCode();
        desiredIdList[id.toString()] = tweet.tweet;
    });
    $('.tweet-list li').each(function(i, elem) {
        existingIdList[$(elem).attr("id")] = $(elem);
    });
    $.each(existingIdList, function(k, v) {
        if (!(k in desiredIdList)) {
            v.remove();
        }    
    });
    $.each(desiredIdList, function(k, v) {
        if (!(k in existingIdList)) {
            tweetList.prepend("<li id='" + k + "'><strong>" + v.created_at + 
                              "</strong> " + v.text + "</li>");
        }
    });
}
