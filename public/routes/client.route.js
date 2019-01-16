
angular.module('adaptive-learning').config(['$routeProvider','$locationProvider',function($routeProvider,$locationProvider){

    $routeProvider.when('/',{
        templateUrl : 'public/views/googlelogin.client.view.html'
    })
}])