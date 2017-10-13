const userController = require('../controllers/user');

module.exports = (app) => {
  app.post('/api/v1/user/signup', userController.signup);
  app.post('/api/v1/user/signin', userController.signin);
  app.put('/api/v1/user/me/:userId([0-9]+)/edit', userController.updateUser);
  app.put('/api/v1/user/signout', userController.signout);
}
