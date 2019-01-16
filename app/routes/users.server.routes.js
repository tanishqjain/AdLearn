var users = require('../controllers/users.server.controller.js'); //this must not a hard coded path 
var passport = require('passport');

module.exports = function(app) {
    //app.route('/users').post(users.create); //we registered /users route to our create method

    app.route('/').get(function(req, res){
        res.sendfile('./index.html');
    });

    app.route('/signup').post(users.signup);

    app.route('/signin').post(
        passport.authenticate('local'),
        function(req, res){
            res.send('successfully logged in .... Hello'+ req.user.firstname)
        }
    )

    app.get('/signout', users.signout);

    app.get('/read', users.read);

    app.post('/update', users.update);
}; 