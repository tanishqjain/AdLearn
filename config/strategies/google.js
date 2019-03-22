const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const users = require('../../app/controllers/users.server.controller');

var User = require('mongoose').model('User');

module.exports = function(){
    passport.use(
        new GoogleStrategy({
            clientID : '959119050212-dmsf23ttgfesthnqk9389bt4a5ac11c9.apps.googleusercontent.com',
            clientSecret : 'pyhCvU2t-0EoXKunEdkgfrqv',
            callbackURL: 'http://localhost:3000/oauth/google/callback',
            passReqToCallback: true
            },
            function(req, accessToken, refreshToken, profile, done) {
                var providerData = profile._json;
                providerData.accessToken = accessToken;
                providerData.refreshToken = refreshToken;

                var providerUserProfile = {
                    firstname: profile.name.givenName,
                    lastname: profile.name.familyName,
                    email: profile.emails[0].value,
                    provider: 'google',
                    providerId: profile.id,
                    providerData: providerData
                };

            users.saveOAuthUserProfile(req, providerUserProfile, done);
        }
    ));
}