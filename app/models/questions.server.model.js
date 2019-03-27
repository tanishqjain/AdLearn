var mongoose = require('mongoose') ;
var random = require('mongoose-simple-random')
var Schema = mongoose.Schema ;

var QuestionSchema = new Schema({
    QuestionStatement: String,
    QuestionType : String,
    Option1: String,
    Option2: String,
    Option3: String,
    Option4: String,
    CorrectAnswer : String,
    DifficultyRank: Number,
    Topic : String,
    Concepts : [{name : String, intensity : Number }]
});

QuestionSchema.plugin(random)
mongoose.model('Question', QuestionSchema);