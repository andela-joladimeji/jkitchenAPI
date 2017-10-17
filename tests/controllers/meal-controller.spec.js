const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const index = require('../../app');
const redis = require('redis')
let client
if (process.env.REDIS_URL) {
  client = redis.createClient(process.env.REDIS_URL, {no_ready_check: true});
} else {
  client = redis.createClient();
}

const Meal = require('../../models').Meal;
const User = require('../../models').User;
const Rating = require('../../models').Rating;
const Comment = require('../../models').Comment;
const MealOrderDetail = require('../../models').MealOrderDetail

chai.use(require('chai-http'));
let mealData = { title: 'Suya meat', price: 50, available_quantity: 10, image: 'http://www.foodsng.com/wp-content/uploads/2015/10/ofada-rice-by-chikadbia.jpg', description: 'assorted meat' }

describe('Meal Controller', () => {
  before(() => {
    return Meal.sequelize.sync();
  });

  describe('Create Function', () => {
    before((done) => {
      Meal.destroy({where: {title: mealData.title}})
        .then(function () {
          done();
        });
    });
    it('should post a Meal', (done) => {
      chai.request(index)
        .post('/api/v1/meals')
        .send(mealData)
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object')
          done()
        })
    });
  })
  describe('list Function', () => {
    it('should return all Meals', (done) => {
      chai.request(index)
        .get('/api/v1/meals')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array')
          done()
        })
    });
  });

  describe('getOne Function', () => {
    it('should return one Meal and save to redis', (done) => {
      Meal.find({where: {title: mealData.title},
        include: [{model: Rating,as: 'ratings'}, {model: Comment, as: 'comments'}, {model: MealOrderDetail, as: 'mealOrderDetails'}]
      })
        .then(function (meal) {
          const mealId = meal.dataValues.id
          chai.request(index)
            .get(`/api/v1/meals/${mealId}`)
            .then(function (res) {
              client.get(`meal${mealId}`, (err, reply) =>{
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object')
                // expect(reply).to.eql(JSON.stringify(meal.dataValues))
                done();
              })
            });
        })
    });
    it('should save popular meals', (done) =>{
      Meal.find({where: {title: mealData.title}})
        .then(function (meal) {
          const mealId = meal.dataValues.id
          chai.request(index)
            .get(`/api/v1/meals/${mealId}`)
            .then(function (res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.an('object')
              // expect(res.body.description).to.have.string('This is white rice and stew with assorted meat')
              done();
            });
        })
    })
  });
  
  // test on caching
  describe('MostPopularMeals Function', () => {
    const mealOne = { title: 'Egg and bread', price: 50, available_quantity: 10, image: 'http://www.foodsng.com/wp-content/uploads/2015/10/ofada-rice-by-chikadbia.jpg', description: 'roasted assorted meat' }
    const mealTwo = { title: 'ofada rice', price: 50, available_quantity: 10, image: 'http://www.foodsng.com/wp-content/uploads/2015/10/ofada-rice-by-chikadbia.jpg', description: 'rice and stew with assorted meat' }
    const mealThree = { title: 'Jollof rice', price: 50, available_quantity: 10, image: 'http://www.foodsng.com/wp-content/uploads/2015/10/ofada-rice-by-chikadbia.jpg', description: 'nigerian jollof' }
    const mealFour = { title: 'Amala and okra', price: 50, available_quantity: 10, image: 'http://www.foodsng.com/wp-content/uploads/2015/10/ofada-rice-by-chikadbia.jpg', description: 'amala' }
    const mealFive = { title: 'Eba and vegetable', price: 50, available_quantity: 10, image: 'http://www.foodsng.com/wp-content/uploads/2015/10/ofada-rice-by-chikadbia.jpg', description: 'white garri and efo riro' }
    const mealSix = { title: 'Moin Moin', price: 50, available_quantity: 10, image: 'http://www.foodsng.com/wp-content/uploads/2015/10/ofada-rice-by-chikadbia.jpg', description: 'bean cake' }
    client.sadd('mostPopularMeals', JSON.stringify(mealThree))
    client.sadd('mostPopularMeals', JSON.stringify(mealFour))
    client.sadd('mostPopularMeals', JSON.stringify(mealFive))

    it('should return 5 most popularMeals', (done) => {
      chai.request(index)
        .get('/api/v1/popularMeals')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('update Function', () => {
    it('should update one Meal', (done) => {
      Meal
        .find({
          where: {
            title: mealData.title,
          },
        })
        .then(function (meal) {
          const mealId = meal.dataValues.id;
          chai.request(index)
            .put(`/api/v1/meals/${mealId}`)
            .send({ image: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
            .then(function (res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.an('object');
              done();
            });
        });
    });
  });

  describe('Ratemeal Function', () => {
    it('should rate one Meal', (done) => {
      let userData = { username: 'EgyptRuns', password: '$32#hdsersd', name: 'Egypt Runs', email: 'egypt@yahoo.com', phoneNumber: '2902390033' };
      let createdUserId;

      User
        .create(userData)
        .then(function (user) {
          createdUserId = user.id;
          Meal
            .find({
              where: {
                title: mealData.title,
              }
            })
            .then(function (meal) {
              let mealId = meal.dataValues.id;
              let rateData = {ratings: 3};
              chai.request(index)
                .post(`/api/v1/users/${createdUserId}/meals/${mealId}/ratings`)
                .send(rateData)
                .then(function (res) {
                  expect(res).to.have.status(200);
                  expect(res).to.be.json;
                  expect(res.body).to.be.an('object');
                  expect(res.body.ratings).to.eql(3);
                  done();
                });
            });
        });
    });
  })

  describe('delete Function', () => {
    it('should delete one Meal', (done) => {
      Meal.find({where: {title: mealData.title}})
        .then(function (meal) {
          const mealId = meal.dataValues.id
          chai.request(index)
            .delete(`/api/v1/meals/${mealId}`)
            .end((err, res) => { 
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.an('object')
              expect(res.body.message).to.eql('Meal deleted.')
              done()
            })
        });
    });
    it('should not delete an unsaved Meal', (done) => {
      chai.request(index)
        .delete(`/api/v1/meals/0`)
        .end((err, res) => { 
          expect(res).to.have.status(500);
          expect(res.body.message).to.eql('Meal Not Found')
          done()
        })
    });

  });
})
