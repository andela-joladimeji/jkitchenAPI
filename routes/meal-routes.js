const mealController = require('../controllers/meal')

module.exports = (app) => {
  app.route('/api/v1/meals') 
    .post(mealController.create)
    .get(mealController.list);
  app.route('/api/v1/meals/:mealId([0-9]+)')
    .get(mealController.getOne)
    .put(mealController.update)
    .delete(mealController.destroy);
  app.route('/api/v1/popularMeals')
    .get(mealController.getMostPopularMeals);
}
