var Question = require('mongoose').model('Question')
var User = require('mongoose').model('User');
var UserPerformance = require('mongoose').model('UserPerformance');
var TopicSchema = require('mongoose').model('Topics')
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
            //console.log(userperformance.topic, userperformance.concepts)
            var i = 0;
            while(true){
                if(userperformance.concepts[i]){
                    weakConceptsArray.push(userperformance.concepts[i].name);
                    failurePercentArray.push(userperformance.concepts[i].failurepercent);
                    i++;
                }
                else break 
            }
            //console.log(weakConceptsArray,failurePercentArray)
            i = 0, sum = 0 ; 
            while(i < failurePercentArray.length){
                sum = sum+failurePercentArray[i]
                i++
            }
            //console.log(sum)
            i=0;
            while (i< failurePercentArray.length){ //finding out Number of Questions on each Concept to be projected
                QuestionsEachConcept.push(Math.round((failurePercentArray[i]/sum)*10));
                i++; 
            }
            //console.log(QuestionsEachConcept)
            i=0;
            while(i < QuestionsEachConcept.length){
                 numberOfQuestions = numberOfQuestions+QuestionsEachConcept[i];
                 i++;
            }
            
            next();
        }
        
        else{
            numberOfQuestions = 10; // If student is giving first attempt in that topic;
            next();
        }
    })
    
}

exports.GenerateQuestions = function(req,res,next){
  if(numberOfQuestions > 0){
    if(weakConceptsArray.length > 0){ 
        console.log(weakConceptsArray[0],attemptedTopic, difficultyLevel,questionsProjected)
        var i = 0
        var questionGenerated ;
        while(true){
            if(numberOfQuestions[i] > 0){
                Question.findOne({$and : [{"Concepts.name" : weakConceptsArray[i]},
                                          {"Concepts.intensity" :{$in : [3,4,5]}},
                                          {"Topic" : attemptedTopic},
                                          {"DifficultyRank" : difficultyLevel},
                                          {"_id" : {$nin : questionsProjected}}]},
                    function (err,question){
                        if(err){
                            var message = getErrorMessage(err);
                            return res.send(message);
                        }
                        else{
                            console.log(question)
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

exports.FinalEvaluation = function(req,res,next){
    //calculating score......
    var maximumMarks = questionsProjected.length*5 // 5 being the difficulty rank
    var score = 0, i=0
    while(i<questionsProjected.length){
        if(answerArray[i] == 1){        
            Question.findById(questionsProjected[i],function(err,question){
            if(err){
                var message = getErrorMessage(err);
                return res.send(message);
            }
            else{
                score = score+question.DifficultyRank
                i++;
            }
        })}
        else{
            i++
        }
    }
    var percent  = score/maximumMarks*100

    //calculating TIRT ratio for recommendation
   
    var tirtMatrix = []
    var tirtMatrixFailure = []
    var summationTirtRatio = []
    var summationTirtRatioFailure = []
    var failurePercentinEachConcept = []
    var finalPerformanceArrayofObjects = []

    var AvailableConceptsArray = []
    TopicSchema.findOne({"Topic" : attemptedTopic}, function(err,topic){
        if(err){
            var message = getErrorMessage(err);
            return res.send(message);
        }
        else{
            AvailableConceptsArray = topic.Concepts
        }
    })

    //creating tirtratio matrix for all questions
    var i=0, j=0
    var tirtRationRow = [];
    while (i<numberOfQuestions){
        j=0;
        tirtRationRow = [];
        while(j<AvailableConceptsArray.length){
            Question.findOne({$and : [{"_id" : questionsProjected[i]},
                                      {"Concepts" : {$elemMatch : {"name" : AvailableConceptsArray[j]}}}
                            ]},
                            function(err,question){
                                if(err){
                                    var message = getErrorMessage(err);
                                    return res.send(message);  
                                }
                                else if(question){ //if question have that concept push its intensity in tirtratio row
                                    var z = 0
                                    while(z<question.Concepts.length){
                                        if(AvailableConceptsArray[j] == question.Concepts[z].name){
                                            break
                                        }
                                        else{ 
                                            z++
                                        }
                                    }
                                    tirtRationRow.push(question.Concepts[z].intensity)
                                }
                                else { // if question doesnt have that concept insert zero
                                    tirtRationRow.push(0)
                                }
                            })
            j++ //do for each concept
        }
        tirtMatrix.push(tirtRationRow)
        i++; //do for each question
    }

    //creating tirt ratio matrix for questions wrongly answered
    i=0
    while(i<answerArray.length){
        if(answerArray[i] == 0){
            tirtMatrixFailure.push(tirtMatrix[i])
            i++
        }
        else{
            i++
        }
    }

    i=0,j=0 // creating summation of tirt ratio all questions
    var sum
    while(i<AvailableConceptsArray.length){
        j=0, sum=0
        while(j<numberOfQuestions){
           sum =  sum + tirtMatrix[j][i]
           j++
        }
        summationTirtRatio.push(sum)
        i++
    }

    i=0, j=0 //creating summation of tirt ratio failed questions
    while(i<AvailableConceptsArray.length){
        j=0, sum=0
        while(j<tirtMatrixFailure.length){
           sum =  sum + tirtMatrixFailure[j][i]
           j++
        }
        summationTirtRatioFailure.push(sum)
        i++
    }

    i=0
    var percentFailure = 0
    while(i<summationTirtRatio.length){
        percentFailure = (summationTirtRatioFailure[i]/summationTirtRatio[i])*100
        failurePercentinEachConcept.push(percentFailure)
        i++
    }

// Finally saving all the data in userPerformance Collection 
    i=0
    while(i<AvailableConceptsArray.length){
        if(failurePercentinEachConcept[i]>0){
            finalPerformanceArrayofObjects.push({"name" : AvailableConceptsArray[i], "failurepercent"  : failurePercentinEachConcept[i]})
            i++
        }
        else{
            i++
        }
    }

    UserPerformance.update({"userEmail" : req.user.email, "topic" : attemptedTopic},
                           {"userEmail" : req.user.email,
                             "topic" : attemptedTopic,
                            "Concepts" : finalPerformanceArrayofObjects,
                            "previousTestScore" : percent,
                            "date" : Date.now}, {upsert : true}, function(err,performance){
                                if(err){
                                    var message = getErrorMessage(err);
                                    return res.send(message); 
                                }
                                else{
                                    res.send("Performance updated successfully......")
                                }
                            })
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
