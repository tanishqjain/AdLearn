var express = require('express'),
    morgan = require('morgan'),
    compress = require('compression'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    passport = require('passport');

module.exports = function() {
    var app = express();

    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    app.use(methodOverride());

    app.use(session({
        saveUninitialized : true,
        resave : true,
        secret : 'createasession' //this secret must be stored as an environmental variable 
    }))

    app.use(passport.initialize()); //bootstrap the passport module
    app.use(passport.session());  //use express session to keep track of user's session

    require('../app/routes/users.server.routes.js')(app); //registering our /user route to invoke our user.create method

    //app.use(express.static('./public'));

    return app;
};