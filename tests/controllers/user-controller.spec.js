process.env.NODE_ENV = 'test';
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const bcrypt = require('bcryptjs');
chai.use(require('chai-http'));
const index = require('../../app');
const userController = require('../../controllers/user');

const User = require('../../models').User;
const userData = { username: 'Jim John', password:'$32#hdsjsd', name: 'JIm Caerey', email:'jim@yahoo.com', phoneNumber:'2902390033' }

describe('User Controller',  () => {
  before(() => {
    return User.sequelize.sync();
  });

  describe('Hash Password', () => {
    it('should hash the new user\'s password', () => {
      hashedPassword = userController.hashPassword('jdiew2')
      assert.equal(true, bcrypt.compareSync('jdiew2', hashedPassword));
    });
  });

  describe('Sign Up Function', function() {
    before(() => { 
      return User
        .destroy({ 
          where: {
            email: userData.email
          }
        })
        .then(function() {
          return;
        });
    }); 


    it('should create users', function(done) {
      chai.request(index)
        .post('/api/v1/user/signup')
        .send(userData)
        .end(function(err, res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          done();
        });
    });

    it('should return an error when the required user details are not all valid or complete', function(done) {
      const incompleteData = {
        email: 'Joy',
        name: 'Joy',
      };
      chai.request(index)
        .post('/api/v1/user/signup')
        .send(incompleteData)
        .end((err, res) => {
          expect(res).to.have.status(422);
          assert.deepEqual(res.body.message,
            ['Provide a valid email',
              'You must enter a username.',
              'You must enter a password.',
              'Password must be at least 7 chars long and contain at least one number',
              'Password must be at least 7 chars long and contain at least one number']);
          done();
        });
    });
  });

  describe('Sign In Function', function(done) {
    it('should sign in users', (done) => {
      chai.request(index)
        .post('/api/v1/user/signin')
        .send({password:userData.password, email: userData.email})
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object')
          done();
      })
    });
  });
  describe('Update User Function', function(done) {
    it('should update user data', (done) => {
      User
        .find({ 
          where: {
            email: userData.email
          }
        })
        .then(function(user){
          const userId = user.dataValues.id
          chai.request(index)
            .put(`/api/v1/user/me/${userId}/edit`)
            .send({username:'Jim Jim'})
            .then(function(res) {
              expect(res).to.have.status(200);
              expect(res).to.be.json;
              expect(res.body).to.have.an('object');
              expect(res.body.username).to.have.string('Jim Jim')
              done();
            });
        });
    });
  });
});