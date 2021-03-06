const { User } = require('../models');
const auth = require('../middleware/authentication');
const passport = require('passport');

module.exports = {
  /**
  * @description - Creates a new user
  * @param {object} request - request object containing the user's email, username, password
   received from the client
  * @param {object} response - response object served to the client
  * @returns {promise} user - new user created
  */
  signup(req, res) {
    const userDetails = req.body;
    User
      .find({
        where: {
          email: userDetails.email,
        },
      })
      .then((existingUser) => {
        if (existingUser) {
          return res.status(422).send({ message: 'That email address is already in use.' });
        }
        const userToCreate = {
          name: userDetails.name,
          username: userDetails.username,
          email: userDetails.email,
          phoneNumber: userDetails.phoneNumber,
          imageURL: userDetails.imageURL,
          socialMediaLinks: userDetails.socialMediaLinks,
          hashedPassword: auth.hashPassword(userDetails.password),
        };
        if (userDetails.role) {
          userToCreate.role = userDetails.role;
        }

        User
          .create(userToCreate)
          .then(newUser => res.status(200).send({ data: newUser, token: auth.generateToken(newUser) }));
      })
      .catch((error) => {
        res.status(500).send({ message: error });
      });
  },
  /**
  * @description - signs in a new user
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {json} user - user details
  */
  signin(req, res) {
    const userDetails = req.body;
    if (!userDetails.email) {
      return res.status(422).send({ message: 'You must enter an email address.' });
    }
    if (!userDetails.password) {
      return res.status(422).send({ message: 'You must enter a password.' });
    }
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) { return res.status(500).json(err); }
      if (user) {
        return res.status(200).send({
          data: user,
          token: auth.generateToken(user),
        });
      }
      return res.status(422).json(info);
    })(req, res);
  },
  signout(req, res) {
    res.redirect('/');
  },
  /**
  * @description - Updates user details
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {json} user - updated user details
  */
  updateUser(req, res) {
    User
      .findById(req.params.userId)
      .then((user) => {
        if (!user) {
          return res.json({
            message: 'User does not exist',
          });
        }
        const userDetails = req.body;
        const hashedPasswordToSave = userDetails.password ? bcrypt.hashSync(userDetails.password, 12) : user.hashedPassword
        user
          .update({
            role: userDetails.role || user.role,
            name: userDetails.name || user.name,
            username: userDetails.username || user.username,
            email: userDetails.email || user.email,
            phoneNumber: userDetails.phoneNumber || user.phoneNumber,
            imageURL: userDetails.imageURL || user.imageURL,
            socialMediaLinks: userDetails.socialMediaLinks || user.socialMediaLinks,
            hashedPassword: hashedPasswordToSave,
          })
          .then((updatedUser) => {
            res.status(200).send(updatedUser);
          });
      })
      .catch((error) => {
        res.json({
          message: error,
        });
      });
  },
  validator(req, res, next) {
    req.checkBody('email', 'You must enter an email address.').notEmpty().isEmail().withMessage('Provide a valid email');
    req.checkBody('name', 'You must enter your full name.').notEmpty();
    req.checkBody('username', 'You must enter a username.').notEmpty();
    req.checkBody('password', 'You must enter a password.').notEmpty();
    req.checkBody('password', 'Password must be at least 7 chars long and contain at least one number')
      .isLength({ min: 7 });

    const validatorErrors = req.validationErrors();
    if (validatorErrors) {
      const response = [];
      validatorErrors.forEach((err) => {
        response.push(err.msg);
      });
      return res.status(422).json({ message: response });
    }
    return next();
  },
  validateBeforeUpdate(req, res, next) {
    req.checkBody('email', 'You must enter an email address.').optional().isEmail().withMessage('Provide a valid email');
    req.checkBody('name', 'You must enter your full name.').optional();
    req.checkBody('username', 'You must enter a username.').optional();
    req.checkBody('password', 'You must enter a password.').optional();
    req.checkBody('password', 'Password must be at least 7 chars long and contain at least one number')
      .optional()
      .isLength({ min: 7 })
      .matches(/\d/);

    const validatorErrors = req.validationErrors();
    if (validatorErrors) {
      const response = [];
      validatorErrors.forEach((err) => {
        response.push(err.msg);
      });
      return res.status(422).json({ message: response});
    }
    return next();
  },
};
