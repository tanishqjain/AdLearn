var mongoose = require('mongoose') ;
var Schema = mongoose.Schema ;

var QuestionSchema = new Schema({
    QuestionStatement: String,
    QuestionType : String,
    Options: String,
    CorrectAnswer : String,
    Catagorie: String,
    SubCatagorieOne: String,
    SubCategorieTwo: String,
    SubcategorieThree: String,
    SubcategorieFour: String,

    DifficultyRank: String
    
    
});
mongoose.model('Question', QuestionSchema);