
mongoose = require('mongoose');
var uri = 'mongodb://localhost/adLearn';

module.exports = function() {
var db = mongoose.connect(uri); //Obtain the db property(uri of mongodb database) of config object

require('../app/models/users.server.model'); //This line registers the user model 
require('../app/models/questions.server.model'); //registers question model
require('../app/models/topics.model'); //registers topic model
require('../app/models/userPerformance.model') //register userperformance model

return db;
};