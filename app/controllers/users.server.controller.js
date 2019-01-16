
var User = require('mongoose').model('User'),
    passport = require('passport');


var getErrorMessage = function(err){
    var message = '';

    if(err.code){
        switch(err.code){
            case 11000 :
            case 11001 :
            message = 'email already exist';
            break;

            default : message = 'something went wrong';
        }
    }

    else {
        for (var errName in err.errors) {
            if (err.errors[errName].message) message = err.errors[errName].message ;
            }
    }

    return message;
}

exports.signup = function(req, res, next){
    if(!req.user){
        User.findOne({
            email : req.body.email
        },function(err,user){
            if(user){
                res.send('this email already exist....')
            }

            else{
                var user = new User(req.body);
        
                var message = null;

                user.provider = 'local';

                user.save(function(err){
                    if(err){
                        var message = getErrorMessage(err);
                        return res.send(message);
                    }   

                    req.login(user, function(err){
                        if(err) return next(err);
                        return res.send("Successfully signed up and Login Successful... ");
                    });
                });
            }
        })
    }

    else{
        return res.send("Already logged in....");
    }
}

exports.signout = function(req, res){
    req.logout();
    res.send("Successfully logged out....");
}

exports.update = function(req, res, next){
    if(req.user){
        User.findByIdAndUpdate(req.user._id, req.body, {new : true}, function(err, user){
            if(err){
                res.send('some error occured');
            }
            res.send(user);
        });
    }   
    
    else{
        res.send("please login")
    }
}

exports.read = function(req, res, next){
    if(req.user){
        User.findOne({
            _id : req.user._id 
            }, function(err, user){
                res.send(user);
                })
    }
    
    else{
        res.send("Please Login")
    }
}






