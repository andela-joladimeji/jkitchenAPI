const mealController = require('../controllers/meal')
const auth = require('../middleware/authentication');

module.exports = (app) => {
  app.route('/api/v1/users/:userId([0-9]+)/meals') 
    .post(auth.verifyToken, auth.verifyAdminAccess, mealController.validate, mealController.create)
    .get(mealController.list);
  app.route('/api/v1/users/:userId([0-9]+)/meals/:mealId([0-9]+)')
    .get(mealController.getOne)
    .put(auth.verifyToken, auth.verifyAdminAccess, mealController.validateBeforeUpdate, mealController.update)
    .delete(auth.verifyToken, auth.verifyAdminAccess, mealController.destroy);
  app.route('/api/v1/meals/popularMeals')
    .get(mealController.getMostPopularMeals);
}

