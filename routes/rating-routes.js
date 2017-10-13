const rateController = require('../controllers/rating')

module.exports = (app) => {
  app.post('/api/v1/users/:userId([0-9]+)/meals/:mealId([0-9]+)/ratings', rateController.rateMeal);
  // app.get('/api/v1/:userId/:mealId/ratings/:rateId', rateController.getRate);
  // app.put('/api/v1/:userId/:mealId/ratings/:rateId', rateController.updateRate);
  // app.delete('/api/v1/:userId/:mealId/ratings/:rateId', rateController.destroy);
}
