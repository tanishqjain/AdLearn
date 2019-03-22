var mongoose = require('mongoose') ;

var Schema = mongoose.Schema ;

var TopicSchema = new Schema({
    Topic : String,
    Concepts : [String]
})

mongoose.model('Topics', TopicSchema);