var UserPerformance = require('mongoose').model('UserPerformance');

exports.addUserPerformance = function(req,res,next){
     
    var newUP = new UserPerformance({userEmail : req.user.email , topic : req.body.topic, concepts : req.body.concepts});
    newUP.save(function(err){
        if(err){res.send(err)
        }
        else{
            res.send("performance data added..")
        }
        })
}
