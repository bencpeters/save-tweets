var users = require('../users');

exports.authenticateUser = function(user, pw, cb) {
    for (var i = 0; i < users.length; ++i) {
        if (users[i].userName !== user) continue;
        if (users[i].password !== pw) return cb("Invaild username or password.", null);
        return cb(null, users[i]);
    }
    return cb("Invalid username or password.", null);
};
