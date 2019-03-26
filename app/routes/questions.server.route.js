var questions = require('../controllers/questions.server.controller')
var topics = require('../controllers/topics.controller')

module.exports = function(app){
    app.post('/AddQuestion',topics.BeforeAddingQuestion ,questions.AddQuestion);

    app.post('/StartQuiz',  questions.KnowExaminee, questions.GenerateQuestions);
    
    app.get('/GenerateQuestion', questions.Evaluate, questions.GenerateQuestions);

    app.post('/Evaluation', questions.FinalEvaluation);

    // for development purposes
    app.get('/UpdateQuestions', questions.updateQuestions);
    app.get('/TestMasterQuery', questions.CheckQuerryThroughMongoose);
    
    }
