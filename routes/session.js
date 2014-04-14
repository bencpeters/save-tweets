exports.requiresLogin = function(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        req.session.prev = req.url;
        res.redirect('/login');
    }
};
