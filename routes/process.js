var spawn = require('child_process').spawn;

var recent_tweets = [];
var save_tweets_process = null;

exports.recentTweets = function(cb) {
    return cb(null, recentTweets);
};

exports.restart = function(req, res, next) {
    stop_process(function(err) {
        if (err) return next(err);
        start_process(function(err) {
            if (err) return next(err);
            req.flash('info', 'Save tweet process restarted!');
            res.redirect('/');
        });
    });
};

exports.stop = function(req, res, next) {
    stop_process(function(err) {
        if (err) return next(err);
        req.flash('info', 'Application no longer saving tweets.');
        res.redirect('/');
    });
};

exports.start = function(req, res, next) {
    start_process(function(err) {
        if (err) return next(err);
        req.flash('info', 'Saving tweets started!');
        res.redirect('/');
    });
};

exports.status = function(req, res, next) {
    return res.json({running: (save_tweets_process !== null && save_tweets_process.pid > 0),
                     pid: save_tweets_process ? save_tweets_process.pid : null
    });
};

function start_process(cb) {
    if (save_tweets_process !== null) {
        return stop_process(function(err) { start_process(cb); });
    }
    save_tweets_process = spawn('./save-tweets.py', ['-c', './settings.json']);
    save_tweets_process.on('exit', function(code) {
        console.error("Save Tweets process exited with code: " + code);
        save_tweets_process = null;
        // auto-restart process - assumption is we failed here not by design
        start_process(function() {});
    });

    readable = save_tweets_process.stdout;
    readable.on('readable', function() {
        var data = JSON.parse(readable.read());
        if (data) {
            console.log("Tweet processed: " + JSON.stringify(data));
            data.ts = new Date().getTime();
            recent_tweets.push(data);
            if (recent_tweets.length > 5) recent_tweets.shift();
        }
    });

    save_tweets_process.stderr.on('readable', function() {
        var err = readable.read();
        console.error("Problem with SaveTweets.py: " + err);
    });

    return cb(null);
}

function stop_process(cb) {
    if (save_tweets_process !== null) {
        save_tweets_process.on('exit', function(code) {
            save_tweets_process = null;
            cb(null);
        });
        return save_tweets_process.kill();
    }
    return cb(null);
}
