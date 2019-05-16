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

        else if(userperformance && userperformance.concepts.length>0){
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
            console.log("previous record found !!")
            console.log(weakConceptsArray,failurePercentArray)
            console.log("number of question and their concept wise division \n",numberOfQuestions,"\n",QuestionsEachConcept)
            console.log("projecting questions according to above performance parameters!")
            console.log("Difficulty Levels below!!")
            next();
        }
        
        else{
            numberOfQuestions = 10; // If student is giving first attempt in that topic;
            console.log("No previous record of this student found!!")
            console.log("Difficulty Levels below!!")
            next();
        }
    })
    
}
var l = 0;
exports.GenerateQuestions = async function(req,res,next){
  if(numberOfQuestions > 0){
    if(weakConceptsArray.length > 0){ 
        
        
        var questionGenerated ;
        while(true){
            if(QuestionsEachConcept[l] > 0){
               try {
                console.log(weakConceptsArray[l])
                let question = await Question.findOne({"Concepts" : {$elemMatch : {"name" : weakConceptsArray[l], "intensity" :{$in : [3,4,5]}}},
                                                    "Topic" : attemptedTopic,
                                                    "DifficultyRank" : difficultyLevel,
                                                    "_id" : {$nin : questionsProjected}}) 
                if(question){
                    answerToPreviousQuestion = question.CorrectAnswer;
                    questionsProjected.push(question._id)
                    questionGenerated = question;
                }
               } catch (err) {
                var message = getErrorMessage(err);
                return res.send(message);    
               }
                
                QuestionsEachConcept[l] = QuestionsEachConcept[l]-1
                break;
            }
    
            else{
                difficultyLevel = 5;
                l++;
            }    
        }
        numberOfQuestions = numberOfQuestions-1;
        console.log(difficultyLevel)
        res.send(questionGenerated);
    }
    
    else{
        try {
            let question = await Question.findOne({
                Topic : attemptedTopic,
                DifficultyRank : difficultyLevel,
                _id : {$nin : questionsProjected}
            }) 
            if(question){
                //console.log(question.QuestionStatement)
                answerToPreviousQuestion = question.CorrectAnswer;
                questionsProjected.push(question._id)
                numberOfQuestions = numberOfQuestions-1;
                console.log(difficultyLevel)
                res.send(question)
                }
        } catch (err) {
            var message = getErrorMessage(err);
            return res.send(message); 
        }
        
      }
  }
  else{
      console.log(answerArray)
      console.log("Notice the dynamic change in difficulty level as per answer array!!")
      res.send("your responses have been saved evaluation in progress.....");
      
  }   
}

exports.Evaluate = function(req,res,next){
    //console.log(questionsProjected)
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



exports.FinalEvaluation = async function(req,res,next){
    //calculating score......
    var maximumMarks = questionsProjected.length*5 // 5 being the difficulty rank
    var score = 0, i=0
    while(i<questionsProjected.length){
        if(answerArray[i] == 1){        
            try {
                let question = await Question.findById(questionsProjected[i])
                if(question)
                {
                    score = score+question.DifficultyRank
                    i++;
                }
            } catch (err) {
                var message = getErrorMessage(err);
                return res.send(message);
            }    
        }
        else{
            i++
        }
    }    
    var percent  = score/maximumMarks*100
    console.log("Final score and percentage are :-")
    console.log(score, percent)

    //calculating TIRT ratio for recommendation
   
    var tirtMatrix = []
    var tirtMatrixFailure = []
    var summationTirtRatio = []
    var summationTirtRatioFailure = []
    var failurePercentinEachConcept = []
    var finalPerformanceArrayofObjects = []

    var AvailableConceptsArray = []
    try {
        let topic  = await TopicSchema.findOne({"Topic" : attemptedTopic})
        if(topic){
            AvailableConceptsArray = topic.Concepts
        }
    } catch (error) {
        var message = getErrorMessage(err);
        return res.send(message);
    }
    console.log(AvailableConceptsArray)
    console.log("These are the total number of subtopics available under this topic")


   //creating tirtratio matrix for all questions
    var i=0, j=0
    var tirtRationRow = [];
    while (i<answerArray.length){
        
        j=0;
        tirtRationRow = [];
        while(j<AvailableConceptsArray.length){
            
            try {
                let question = await Question.findOne({$and : [{"_id" : questionsProjected[i]},
                                      {"Concepts" : {$elemMatch : {"name" : AvailableConceptsArray[j]}}}]})
                if(question){
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
                else {         // if question doesnt have that concept insert zero
                    tirtRationRow.push(0)
                }
            } catch (err) {
                var message = getErrorMessage(err);
                return res.send(message);
            }   
                            
            j++ //do for each concept
        }
        
        tirtMatrix.push(tirtRationRow)
        i++; //do for each question
    }
    console.log("Tirt matrix for all the questions!!")
    console.log(tirtMatrix)
   
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
    console.log("tirt matrix for the questions incorrectly answered!")
    console.log(tirtMatrixFailure)

    i=0,j=0 // creating summation of tirt ratio all questions
    var sum
    while(i<AvailableConceptsArray.length){
        j=0, sum=0
        while(j<answerArray.length){
           sum =  sum + tirtMatrix[j][i]
           j++
        }
        summationTirtRatio.push(sum)
        i++
    }
    console.log("summation of tirt ratio all questions!")
    console.log(summationTirtRatio)

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
    console.log("summation of tirt ratio failed questions!")
    console.log(summationTirtRatioFailure)


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
    console.log(finalPerformanceArrayofObjects)


   try {
        let performance = await UserPerformance.updateOne({"userEmail" : req.user.email, "topic" : attemptedTopic},
        {"userEmail" : req.user.email,
        "topic" : attemptedTopic,
        "concepts" : finalPerformanceArrayofObjects,
        "previousTestScore" : percent,
        "date" : Date.now()}, {upsert : true})

        if(performance){
    res.send("Performance updated successfully......")
    }
    } catch (err) {
        var message = getErrorMessage(err);
        return res.send(message);
    }
}


exports.settingQuestionDifficulty = function(req,res,next){

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
 
