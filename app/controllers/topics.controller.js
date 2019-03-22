var Topic = require('mongoose').model('Topics');
var Question = require('mongoose').model('Question');

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

//this function will create or update concepts related to a respective topic

exports.BeforeAddingQuestion = function(req,res,next){
    var question = new Question(req.body);

    Topic.find({ Topic : question.Topic}, function(err, topic){
        if(topic){
            var previousConcepts = topic.Concepts //this function creates an array of concepts name from array of CONCEPTS OBJECT
            var newConcepts = question.Concepts.map(a => a.name) 
            var ConcatenatedArray = previousConcepts.concat(newConcepts)
            var finalArray = [...new Set(ConcatenatedArray)]

            Topic.findOneAndUpdate({Topic : topic}, {Concepts : finalArray}, function(err){
                var message = getErrorMessage(err);
                    return res.send(message);
            })
        }

        else {
            var newtopic = new Topic({Topic : question.Topic, Concepts : question.Concepts});
            newtopic.save(function(err){
                if(err){
                    var message = getErrorMessage(err);
                    return res.send(message);
                }
            })
        }
    })
    next();
}