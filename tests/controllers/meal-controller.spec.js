const mocha = require('mocha');

const chai = require('chai');

const expect = chai.expect;

const assert = chai.assert;

const index = require('../../app');

const redis = require('redis');

let client;
if (process.env.REDIS_URL) {
  client = redis.createClient(process.env.REDIS_URL, {no_ready_check: true});
} else {
  client = redis.createClient();
}
chai.use(require('chai-http'));

const Meal = require('../../models').Meal;
const User = require('../../models').User;
const Rating = require('../../models').Rating;
const Comment = require('../../models').Comment;
const MealOrderDetail = require('../../models').MealOrderDetail;
const mockData = require('../mock-data')
const userHelper = require('../helper/user-helper')
let mealData = { title: 'Suya meat', price: 50, available_quantity: 10, image: 'http://www.foodsng.com/wp-content/uploads/2015/10/ofada-rice-by-chikadbia.jpg', description: 'assorted meat' };
const adminUser = mockData.adminUser
let createdAdminData;
let createdUserData;
let adminToken;
let meal;

describe('Meal Controller', () => {
  before(() => {
    return Meal.sequelize.sync()
    .then(()=> {
        return userHelper.getUserToken(adminUser)
      })

    .then((response) => {
      createdAdminData = response;
      return userHelper.getUserToken(mockData.userData);
    })
    .then((response) => {
      createdUserData = response;
    });
  });

  describe('Create Function', () => {
    before((done) => {
      Meal.destroy({where: {title: mealData.title}})
        .then(function () {
          done();
        });
    });
    it('should return an error message when the token is not provided', function(done) {
      chai.request(index)
        .post(`/api/v1/users/${createdAdminData.data.id}/meals`)
        .send(mealData)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.eql('Token required for access');
          done();
        })
    });
    it('should return an error message when the user is not logged in', function(done) {
      chai.request(index)
        .post(`/api/v1/users/${createdUserData.data.id}/meals`)
        .set('authorization', `${mockData.invalidToken}`)
        .send(mealData)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.eql('Session expired. Please login to continue');
          done();
        });
    });
    it('should return an error message when a non admin user wants to post articles', function(done) {
      chai.request(index)
        .post(`/api/v1/users/${createdUserData.data.id}/meals`)
        .set('authorization', `${createdUserData.token}`)
        .send(mealData)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.message).to.eql('Sorry, You are not authorized to perform this action');
          done();
        });
    });

    it('should post a meal it is an admin user', (done) => {
      chai.request(index)
        .post(`/api/v1/users/${createdAdminData.data.id}/meals`)
        .send(mealData)
        .set('authorization', `${createdAdminData.token}`)
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.title).to.equal('Suya meat');
          expect(res.body.price).to.equal(50);
          expect(res.body.available_quantity).to.equal(10);
          expect(res.body.image).to.equal('http://www.foodsng.com/wp-content/uploads/2015/10/ofada-rice-by-chikadbia.jpg');
          done()
        })
    });
  })
  describe('list Function', () => {
    it('should return all Meals', (done) => {
      chai.request(index)
        .get(`/api/v1/users/${createdAdminData.data.id}/meals`)
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          done();
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
            .get(`/api/v1/users/${createdAdminData.data.id}/meals/${mealId}`)
            .then(function (res) {
              client.get(`meal${mealId}`, (err, reply) => {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.property('title').to.equal('Suya meat');
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
            .get(`/api/v1/users/${createdAdminData.data.id}/meals/${mealId}`)
            .then(function (res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.an('object')
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
        .get('/api/v1/meals/popularMeals')
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('update Function', () => {
    before(() => {
       return Meal
        .find({
          where: {
            title: mealData.title,
          },
        })
        .then(function (foundMeal) {
          meal = foundMeal.get();
        })
      })

    it('should return an error message when the token is not provided', function(done) {
      chai.request(index)
        .put(`/api/v1/users/${createdUserData.data.id}/meals/${meal.id}`)
        .send({ image: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.eql('Token required for access');
          done();
        })
    });

    it('should return an error message when the user is not logged in', function(done) {
      chai.request(index)
        .put(`/api/v1/users/${createdUserData.data.id}/meals/${meal.id}`)
        .set('authorization', `${mockData.invalidToken}`)
        .send({ image: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.eql('Session expired. Please login to continue');
          done();
        });
    });
    it('should return an error message when a non admin user wants to post articles', function(done) {
      chai.request(index)
        .put(`/api/v1/users/${createdUserData.data.id}/meals/${meal.id}`)
        .set('authorization', `${createdUserData.token}`)
        .send({ image: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.message).to.eql('Sorry, You are not authorized to perform this action');
          done();
        });
    });

    it('should update one Meal when it is an admin user', (done) => {
      chai.request(index)
        .put(`/api/v1/users/${createdAdminData.data.id}/meals/${meal.id}`)
        .set('authorization', `${createdAdminData.token}`)
        .send({ image: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.image).to.eql( 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg');
          done();
        });
    });
  });

  describe('Ratemeal Function', () => {
    it('should rate one Meal', (done) => {
      let rateData = {ratings: 3};
      chai.request(index)
        .post(`/api/v1/users/${createdUserData.data.id}/meals/${meal.id}/ratings`)
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
  describe('delete Function', () => {
    it('should delete one Meal', (done) => {
      Meal.find({where: {title: mealData.title}})
        .then(function (meal) {
          const mealId = meal.dataValues.id
          chai.request(index)
            .delete(`/api/v1/users/${createdAdminData.data.id}/meals/${mealId}`)
            .set('authorization', `${createdAdminData.token}`)
            .end((err, res) => { 
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.be.an('object')
              expect(res.body.message).to.eql('Meal deleted.')
              done();
            })
        });
    });
    it('should not delete an unsaved Meal', (done) => {
      chai.request(index)
        .delete(`/api/v1/users/${createdAdminData.data.id}/meals/0`)
        .set('authorization', `${createdAdminData.token}`)
        .end((err, res) => { 
          expect(res).to.have.status(500);
          expect(res.body.message).to.eql('Meal Not Found')
          done();
        })
    });

  });
})
