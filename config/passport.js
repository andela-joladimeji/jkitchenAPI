const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models').User;
const auth = require('../middleware/authentication');

// sign in
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
}, (email, password, done) => {
  User.find({ where: { email: email } }).then((user) => {
    if (!user || !auth.validPassword(password, user.hashedPassword)) {
      return done(null, false, { message: { 'email or password': 'is invalid' } });
    }
    const userinfo = user.get();
    return done(null, userinfo);
  }).catch(done);
}));
