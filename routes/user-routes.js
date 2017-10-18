const userController = require('../controllers/user');

module.exports = (app) => {
  app.route('/api/v1/user/signup')
    .post(userController.validator, userController.signup);
  app.route('/api/v1/user/signin')
    .post(userController.signin);
  app.route('/api/v1/user/me/:userId([0-9]+)/edit')
    .put(userController.validateBeforeUpdate, userController.updateUser);
  app.route('/api/v1/user/signout')
    .put(userController.signout);
}
