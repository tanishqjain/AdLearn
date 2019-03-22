var mongoose = require('mongoose') ;
var Schema = mongoose.Schema ;

var userPerfSchema = new Schema({
    userEmail : String,
    topic : String,
    concepts : [{name : String, failurepercent : Number}]
})

mongoose.model('UserPerformance', userPerfSchema);