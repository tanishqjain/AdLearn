var Question = require('mongoose').model('Question')
var User = require('mongoose').model('User');
var UserPerformance = require('mongoose').model('UserPerformance');
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

exports.AddQuestion = function(req, res, next){
    var question = new Question(req.body);

    question.save(function(err){
        if(err){
            var message = getErrorMessage(err);
            return res.send(message);
        }   
        res.send("Question Added Successfully")
    })
}

//here we required a json object in request body which carry topic of quiz to be attempted
var questionsProjected = [];
var difficultyLevel = 5;
var attemptedTopic;
var weakConceptsArray = [];
var failurePercentArray = [];
var answerToPreviousQuestion;
var answerArray = [];
var QuestionsEachConcept = [];
var numberOfQuestions = 0;

exports.KnowExaminee = function(req,res,next){
    attemptedTopic = req.body.topic;
    UserPerformance.findOne({userEmail : req.user.email, topic : req.body.topic}, function(err, userperformance){
        if(err){
            var message = getErrorMessage(err);
            return res.send(message);
        }

        else if(userperformance){
            
            var i = 0;
            while(true){
                if(userperformance.concepts[i]){
                    weakConceptsArray.push(userperformance.concepts[i].name);
                    failurePercentArray.push(userperformance.concepts[i].failurepercent);
                    i++;
                }
                else break 
            }
            
            var i = 0, sum = 0 ; 
            while(i < failurePercentArray.length){
                sum = sum+failurePercentArray[i]
            }

            i=0;
            while (i< failurePercentArray.length){ //finding out Number of Questions on each Concept to be projected
                QuestionsEachConcept.push(Math.round(failurePercentArray[i]/sum*10));
                i++; 
            }

            i=0;
            while(i < QuestionsEachConcept.length){
                 numberOfQuestions = numberOfQuestions+QuestionsEachConcept[i];
                 i++;
            }
            numberOfQuestions = numberOfQuestions; // 5 extra questions from random concepts
        }

        else{
            numberOfQuestions = 10; // If student is giving first attempt in that topic;
        }
        
    })
    res.redirect('/GenerateQuestion')
    next();
}

exports.GenerateQuestions = function(req,res,next){
  if(numberOfQuestions > 0){
    if(weakConceptsArray.length > 0){ 
        var i = 0
        var questionGenerated ;
        while(true){
            if(numberOfQuestions[i] > 0){
                Question.findOne({$and : [{"Concepts.name" : weakConceptsArray[i]},{"Concepts.intensity" : {$in : [3,4,5]}},
                    {"Topic" : attemptedTopic},{"DifficultyRank" : difficultyLevel},{_id : {$nin : questionsProjected}}]},
                    function (err,question){
                        if(err){
                            var message = getErrorMessage(err);
                            return res.send(message);
                        }
                        else{
                            answerToPreviousQuestion = question.CorrectAnswer;
                            questionsProjected.push(question._id)
                            questionGenerated = question;
                        }
                })
                numberOfQuestions[i] = numberOfQuestions[i]-1
                break;
            }
    
            else{
                difficultyLevel = 5;
                i++;
            }
            numberOfQuestions = numberOfQuestions-1;
            res.send(questionGenerated);
            
        }
    
    
    
      }
    
      else{
        
        Question.findOneRandom({
            Topic : attemptedTopic,
            DifficultyRank : difficultyLevel,
            _id : {$nin : questionsProjected}
        }, function(err, question){
            if(err){
                var message = getErrorMessage(err);
                return res.send(message);
            }
            else{
                answerToPreviousQuestion = question.CorrectAnswer;
                questionsProjected.push(question._id)
                numberOfQuestions = numberOfQuestions-1;
                res.send(question)
                
            }
        })
      }
  }

  else{
      res.send("your responses have been saved evaluation in progress.....");
      FinalEvaluation();
  }   
}

exports.Evaluate = function(req,res,next){
    if(questionsProjected.length > 0){
        if(req.query.answer == answerToPreviousQuestion){
            answerArray.push(1)
            if(difficultyLevel < 5){
                difficultyLevel++
            }
        }   
        else{
            answerArray.push(0)
            if(difficultyLevel > 1){
                difficultyLevel--;
            }
        }
    }
    next();
}

exports.FinalEvaluation = function(){

}





/*************************************************************
 * ***********Developmental purpose controller functions below
 * *******************************************
 */



exports.updateQuestions = function(req,res,next){
    var arr = [2,3,4,5]
    Question.update({
        DifficultyRank : {$in : arr}
    }, {Topic : "operating systems"}, { multi: true }, function(err){
        if(err){
            var message = getErrorMessage(err);
            return res.send(message);
        }
        else {
            console.log("update successful..")
        }
    })
}

exports.CheckQuerryThroughMongoose = function(req,res,next){
    Question.findOne({$and : [{"Concepts.name" : "file structures"},{"Concepts.intensity" : {$in : [3,4,5]}},
    {"Topic" : "dbms"},{"DifficultyRank" : "1"},{_id : {$nin : ["5c9241f9465cbdef75e4eb4a"]}}]}, function (err,questionGenerated){
        if(err){
            var message = getErrorMessage(err);
            return res.send(message);
        }
        else{
            res.send(questionGenerated);
        }
    })
}


