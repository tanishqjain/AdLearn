var passport = require('passport'),
    mongoose = require('mongoose');

    module.exports = function(){
        var User = mongoose.model('User');

        passport.serializeUser(function(user, done){  //this function append user id to our session object
            done(null, user.id);
        });

        passport.deserializeUser(function(id, done){ //this function use to retrieve user object according to the id stored in session object by above method
            User.findOne({
                _id : id
            }, '-password -salt', function(err, user){
                done(err, user);
            });
        });

        require('../config/strategies/local.js')() ; //calls our local strategie file
    };