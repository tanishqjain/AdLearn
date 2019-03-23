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
    Topic.findOne({"Topic" : question.Topic}, function(err, topic){
        if(err){
            var message = getErrorMessage(err);
            return res.send(message); 
        }   
        
        else if(topic){
            var i=0,j=0,flag
            var newConcepts = [];
            while(i<question.Concepts.length){
                flag = 0, j=0;
                while(j<topic.Concepts.length){
                    if(question.Concepts[i].name == topic.Concepts[j]){
                        flag = 1
                        break;
                    }
                    else{
                        j++
                    }
                }
                if(flag==1){
                    i++
                }
                else{
                    newConcepts.push(question.Concepts[i].name)
                    i++;
                }
            }
            
            Topic.updateOne({"Topic" : question.Topic},
                        {$push : {"Concepts" : {$each : newConcepts}}}, function(err){
                            if(err){
                                var message = getErrorMessage(err);
                                return res.send(message);
                            }
                        })

        }

        else{
            var i = 0, conceptsArray = [];
            while(i<question.Concepts.length){
                conceptsArray.push(question.Concepts[i].name);
                i++
            }
            var topicfinal = new Topic({"Topic" : question.Topic , "Concepts" : conceptsArray})
            topicfinal.save(function(err){
                if(err){
                    var message = getErrorMessage(err);
                    return res.send(message);
                }
                
            })
        }
    })

    next();
}








/****************************************************************************************************
 * ***********Some Function Implemented but have certain logical errors******************************
 * ***************************************************************************************************
 */


/*exports.BeforeAddingQuestion = function(req,res,next){
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

exports.BeforeAddingQuestion2 = function(req,res,next){

    var question = new Question(req.body);
    Topic.findOne({"Topic" : question.Topic}, function(err, topicfirst){
        if(err){
            var message = getErrorMessage(err);
            return res.send(message);
        }

        else if(topicfirst){
            var i = 0;
            
            while(i < question.Concepts.length){
                Topic.findOne({$and : [{"Topic" : question.Topic},
                {"Concepts" : question.Concepts[i].name}]}, function(err, topicsecond){
                    if(err){
                        var message = getErrorMessage(err);
                        return res.send(message);
                    }

                    else if(topicsecond){
                        i++;
                    }

                    else {
                        Topic.update({"Topic" : question.Topic},
                        {$push : {"Concepts" : question.Concepts[i].name}}, function(err, topicthird){
                            if(err){
                                var message = getErrorMessage(err);
                                return res.send(message);
                            }

                            else {
                                i++;
                            }
                        })
                    }
                })
            }
        }
        else{
            var i = 0, conceptsArray = [];
            while(i<question.Concepts.length){
                conceptsArray.push(question.Concepts[i].name);
                i++
            }
            var topicfinal = new Topic({"Topic" : question.Topic , "Concepts" : conceptsArray})
            topicfinal.save(function(err){
                if(err){
                    var message = getErrorMessage(err);
                    return res.send(message);
                }
                
            })
        }
    })
    
    next();
}*/