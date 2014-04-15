var fs = require('fs');

/*
 * GET home page.
 */

exports.index = function(req, res, next) {
    res.render('index', { title: 'Save Tweets Dashboard'});
};

exports.settings = function(req, res, next) {
    res.json(req.app.locals.settings);
};

exports.saveSettings = function(req, res, next) {
    newSettings = validateSettings(req.body, req.app.locals.settings);
    fs.writeFile('settings.json', JSON.stringify(newSettings, undefined, 4), function(err) {
        if (err) return next(err);
        return res.redirect('/');
    });
};

function validateSettings(newSettings, currentValues) {
    var validSettings = ['twitterToken', 'twitterTokenSecret', 'twitterAPIKey', 
                         'twitterAPISecret', 'S3BucketName', 'searchTerm', 
                         'AWSKey', 'AWSSecret'];
                     for (var setting in newSettings) if (newSettings.hasOwnProperty(setting)) {
        if (validSettings.indexOf(setting) === -1) continue;
        currentValues[setting] = newSettings[setting];
    }
    return currentValues;
}
