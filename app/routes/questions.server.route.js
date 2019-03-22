var questions = require('../controllers/questions.server.controller')
var topics = require('../controllers/topics.controller')

module.exports = function(app){
    app.post('/AddQuestion', questions.AddQuestion);

    app.post('/StartQuiz',  questions.KnowExaminee);
    
    app.get('/GenerateQuestion', questions.Evaluate, questions.GenerateQuestions);

    // for development purposes
    app.get('/UpdateQuestions', questions.updateQuestions);
    app.get('/TestMasterQuery', questions.CheckQuerryThroughMongoose);
    
    }
