var mongoose = require('mongoose') ;
var Schema = mongoose.Schema ;
var crypto = require('crypto'); //this module helps us in generating hash

var UserSchema = new Schema({
    firstname: {
        type : String,
        required : 'Firstname is required'
    },
    lastname: {
        type : String,
        required : 'Lastname is required'
    },
    email: {
        type : String,
        unique : 'You are already registered',
        match : [/.+\@.+\..+/, "Please fill a valid e-mail address"] //validating the email address
    },
    password: {
        type : String,
        validate : [
            function(password){
                return password && password.length > 6;
            }, 'Password should be longer'
        ]
    },
    salt : String,
    provider : {        //this field is required to know the strategy through which user has registered
        type : String,
        required : 'Provider is required'
    },

    //providerId : String , //indicate userId for authentication strategy
    //providerData : {}, //this field would be used to store user Object provided by OAuth providers
    
    created :{
        type : Date,
        default : Date.now 
    },

});


UserSchema.methods.hashpassword = function(password){ 
    return crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha512').toString('base64');
};

UserSchema.pre('save', function(next){                  //this method will run before saving a user into database
    if(this.password){
        this.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64'); // create a new salt using method provided by crypto module
        this.password = this.hashpassword(this.password); // hash the password with salt and create hashed password to be stored in the database
    }

    next();
});


UserSchema.methods.authenticate = function(password){    // this method is used in local strategy file to authenticate a user
    return this.password === this.hashpassword(password);
}

UserSchema.set('toJSON',{
    getters : true,
    virtuals : true
})

mongoose.model('User', UserSchema);