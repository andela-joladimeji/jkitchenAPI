const { Meal, Rating, Comment, MealOrderDetail } = require('../models');
const redis = require('redis');

let client;
if (process.env.REDIS_URL) {
  client = redis.createClient(process.env.REDIS_URL, { no_ready_check: true });
} else {
  client = redis.createClient();
}
module.exports = {
  /**
  * @description - Creates a new meal
  * @param {object} request - request object containing the meal title, price,available_quantity,image,
  * description received from the client
  * @param {object} response - response object served to the client
  * @returns {json} meal - new meal created
  */
  // Only admin can create and update meal
  create(req, res) {
    Meal
      .create({
        title: req.body.title,
        price: req.body.price,
        available_quantity: req.body.available_quantity,
        image: req.body.image,
        description: req.body.description,
      })
      .then(meal => res.status(200).send(meal))
      .catch((error) => {
        res.status(500).send({ message: error });
      });
  },


  /**
  * @description - Fetches all meals
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {json} meals - meals fetched
  */

  list(req, res) {
    Meal
      .findAll({
        include: [
          {
            model: Rating,
            as: 'ratings',
          }],
      })
      .then(meals => res.status(200).send(meals))
      .catch((error) => {
        res.status(500).send({ message: error });
      });
  },
  /**
  * @description - Fetches a meal
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {json} meal - fetched meal
  */
  getOne(req, res) {
    const { mealId } = req.params;
    // get meal from redis cache
    client.get(`meal${mealId}`, (err, reply) => {
      if (err) {
        return res.status(500).send({ message: err });
      }
      if (reply) {
        const meal = JSON.parse(reply);
        // create a set in redis for popular meals
        // when count is more than one, add the meal to popular meals
        if (meal.count > 1) {
          client.sadd('mostPopularMeals', reply);
        } else {
          meal.count++;
          client.set(`meal${mealId}`, JSON.stringify(meal), (error, response) => {
            if (error) {
              return res.status(500).send({ message: error });
            }
            return res.status(200).send(meal);
          });
        }
      } else {
        Meal
          .findById(mealId, {
            include: [{
              model: Rating,
              as: 'ratings',
            }, {
              model: Comment,
              as: 'comments',
            }, {
              model: MealOrderDetail,
              as: 'mealOrderDetails',
            }],
          })
          .then((meal) => {
            if (!meal) {
              return res.status(404).send({
                message: 'Meal Not Found',
              });
            }
            const mealToCache = meal.dataValues;
            mealToCache.count = 0;
            client.set(`meal${mealId}`, JSON.stringify(mealToCache), function (err, reply) {
              return res.status(200).send(meal);
            });
          })
          .catch((error) => {
            res.status(500).send({ message: error });
          });
      }
    });
  },
  /**
  * @description - Fetches the popular meals
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {array} meals - Popular meals
  */
  getMostPopularMeals(req, res) {
    client.smembers('mostPopularMeals', (err, reply) => {
      if (err) {
        return res.status(500).send({ message: err });
      }
      // reply is an array of popular meals
      return res.status(200).send(reply);
    });
  },
   /**
  * @description - Updates meal details
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {json} meal - updated meal details
  */
  update(req, res) {
    const { mealId } = req.params;
    Meal
      .findById(mealId, {
        include: [{
          model: Rating,
          as: 'ratings',
        }, {
          model: Comment,
          as: 'comments',
        }, {
          model: MealOrderDetail,
          as: 'mealOrderDetails',
        }],
      })
      .then((meal) => {
        if (!meal) {
          return res.status(404).send({
            message: 'Meal Not Found',
          });
        }
        meal
          .update({
            title: req.body.title || meal.title,
            price: req.body.price || meal.price,
            available_quantity: req.body.available_quantity || meal.available_quantity,
            image: req.body.image || meal.image,
            description: req.body.description || meal.description,
          })
          .then((updatedMeal) => {
            const mealToUpdate = JSON.stringify(meal);
            // delete meal from the mostPopularMeals set
            client.srem('mostPopularMeals', mealToUpdate);
            // add updated meal to the set
            client.sadd('mostPopularMeals', JSON.stringify(updatedMeal));
            // client.smembers('mostPopularMeals')
            // update meal in redis string
            client.set(`meal${mealId}`, JSON.stringify(updatedMeal), (err, updatedMealInCache) => {
              return res.status(200).send(updatedMeal);
            });
          });
      })
      .catch((error) => {
        res.status(500).send({ message: error });
      });
  },
  /**
  * @description - Deletes a meal
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {json} - Meal created
  */
  destroy(req, res) {
    const { mealId } = req.params;
    Meal
      .findById(mealId)
      .then((meal) => {
        if (!meal) {
          return res.status(500).send({
            message: 'Meal Not Found',
          });
        }
        return meal
          .destroy()
          .then(() => {
            const mealToDelete = JSON.stringify(meal);
            client.srem('mostPopularMeals', mealToDelete);
            client.del(`meal${mealId}`);
            res.status(200).send({ message: 'Meal deleted.' });
          });
      })
      .catch((error) => {
        res.status(400).send({ message: error });
      });
  },
  validate(req, res, next) {
    req.checkBody('title', 'Please enter the name of your meal of max length 30 characters.').notEmpty().isLength({ max: 30 });
    req.checkBody('price', 'You must enter the price of the meal. This accepts only integers.').notEmpty().isInt();
    req.checkBody('available_quantity', 'You must enter the quantity of the meal available for sale. This accepts only integers.').notEmpty().isInt();
    req.checkBody('description', 'Enter a short description of your meal. It must not be more than 500 characters.').optional().isLength({ max: 500 });
    req.checkBody('image', 'Enter a valid url for your image.').optional().isURL();

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
  validateBeforeUpdate(req, res, next) {
    req.checkBody('title', 'Please enter the name of your meal of max length 30 characters.').optional().isLength({ max: 30 });
    req.checkBody('price', 'You must enter the price of the meal. This accepts only integers.').optional().isInt();
    req.checkBody('available_quantity', 'You must enter the quantity of the meal available for sale. This accepts only integers.').optional().isInt();
    req.checkBody('description', 'Enter a short description of your meal. It must not be more than 500 characters.').optional().isLength({ max: 500 });
    req.checkBody('image', 'Enter a valid url for your image.').optional().isURL();

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
};
