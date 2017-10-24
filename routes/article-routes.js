const articleController = require('../controllers/article');
const auth = require('../middleware/authentication');

module.exports = (app) => {
  app.route('/api/v1/users/:userId([0-9]+)/articles')
    .post(auth.verifyToken, auth.verifyAdminAccess, articleController.validate, articleController.create)
    .get(articleController.list);
  app.route('/api/v1/users/:userId([0-9]+)/articles/:articleId')
    .get(articleController.getOne)
    .put(auth.verifyToken, auth.verifyAdminAccess, articleController.validateBeforeUpdate, articleController.update)
    .delete(auth.verifyToken, auth.verifyAdminAccess, articleController.destroy);
};
