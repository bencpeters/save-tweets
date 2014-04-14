/*
 * GET login page
 */
exports.login = function(req, res, next) {
    //already logged in
    if (req.session.user) {
        var url = req.session.prev ? req.session.prev : "/";
        return res.redirect(url);
    }
    res.render('login', { title: 'Login' });
};

/*
 * POST login
 */
exports.processLogin = function(req, res, next) {
    //already logged in
    if (req.session.user) {
        var url = req.session.prev ? req.session.prev : "/";
        return res.redirect(url);
    }

    if (req.body.password && req.body.password.length > 0) {
        res.app.locals.userAPI.authenticateUser(req.body.username, req.body.password, function(err, user) {
            if (user) {
                var url = req.session.prev ? req.session.prev : "/";
                req.session.user = user;
                res.redirect(url);
            } else {
                res.status(400);
                res.render('login', { title: 'Login', error: err });
            }
        });
    } else {
        res.render('login', { title: 'Login'});
    }
};

/*
 * POST logout
 */
exports.logout = function(req, res, next) {
    if (req.session.user) {
        delete req.session.user;
    }
    res.redirect('/login');
};
