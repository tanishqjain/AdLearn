var userPerformance = require('../controllers/userPerformance.controller');

module.exports = function(app){
    app.post('/addPerformanceData', userPerformance.addUserPerformance);
}