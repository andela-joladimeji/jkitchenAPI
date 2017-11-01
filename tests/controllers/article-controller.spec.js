const chai = require('chai');
const { assert, expect } = chai;
const index = require('../../app');
const nock = require('nock');
chai.use(require('chai-http'));


const { Article, User } = require('../../models');
const mockData = require('../mock-data');
const userHelper = require('../helper/user-helper');

const incompleteArticleData = {
  content: 'Joy',
  excerpt: 'This is about that emotion that makes you want to shout and dance'
};

const completeArticleData = {
  title: 'Joy',
  content: 'Joy',
  excerpt: 'This is about that emotion that makes you want to shout and dance',
  imageURL: 'http://www.lifechurch242.org/wp-content/uploads/2016/01/Joy.jpg'
};

const { adminUser, userData } = mockData;
let createdAdminData;
let createdUserData;
let createdArticleData;
let articleId;

describe('Article Controller', () => {
  before(() => {
    return User.sequelize.sync()
      .then(() =>
        Article.sequelize.sync())
      .then(() =>
        userHelper.getUserToken(adminUser))
      .then((response) => {
        createdAdminData = response;
        return userHelper.getUserToken(userData);
      })
      .then((response) => {
        createdUserData = response;
        return Article.create(completeArticleData);
      })
      .then((article) => {
        createdArticleData = article.get();
        articleId = createdArticleData.id;
      });
  });

  describe('Create Function', () => {

    it('should return an error message when the token is not provided', (done) => {
      nock('/api/v1')
        .post(`/users/${createdAdminData.data.id}/articles`, incompleteArticleData)
        .reply(401);
      chai.request(index)
        .post(`/api/v1/users/${createdAdminData.data.id}/articles`)
        .send(incompleteArticleData)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.eql('Token required for access');
          done();
        });
    });

    it('should return an error message when the user is not logged in', (done) => {
      nock('/api/v1')
        .post(`/users/${createdUserData.data.id}/articles`, incompleteArticleData)
        .reply(401);
      chai.request(index)
        .post(`/api/v1/users/${createdUserData.data.id}/articles`)
        .set('authorization', `${mockData.invalidToken}`)
        .send(incompleteArticleData)
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.eql('Session expired. Please login to continue');
          done();
        });
    });
  
    it('should return an error message when a non admin user wants to post articles', (done) => {
      nock('/api/v1')
        .post(`/users/${createdUserData.data.id}/articles`, incompleteArticleData)
        .reply(403);
      chai.request(index)
        .post(`/api/v1/users/${createdUserData.data.id}/articles`)
        .set('authorization', `${createdUserData.token}`)
        .send(incompleteArticleData)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.message).to.eql('Sorry, You are not authorized to perform this action');
          done();
        });
    });

    it('should return an error message when an admin user wants to post an article with incomplete required data', (done) => {
      nock('/api/v1')
        .post(`/users/${createdAdminData.data.id}/articles`, incompleteArticleData)
        .reply(422);
      chai.request(index)
        .post(`/api/v1/users/${createdAdminData.data.id}/articles`)
        .set('authorization', `${createdAdminData.token}`)
        .send(incompleteArticleData)
        .end((err, res) => {
          expect(res).to.have.status(422);
          assert.deepEqual(res.body.message, ['Please enter the title of your article.']);
          done();
        });
    });

    it('should return an error message when the required data is invalid', (done) => {
      nock('/api/v1')
        .post(`/users/${createdAdminData.data.id}/articles`, incompleteArticleData)
        .reply(422);
      chai.request(index)
        .post(`/api/v1/users/${createdAdminData.data.id}/articles`)
        .set('authorization', `${createdAdminData.token}`)
        .send({ title: 'Coders', excerpt: 'This is about coders who enjoy what they do', content: 134 })
        .end((err, res) => {
          expect(res).to.have.status(422);
          assert.deepEqual(res.body.message, ['You must enter the content of the article and allows only alphabets']);
          done();
        });
    });

    it('should return success an admin user wants to post an article', (done) => {
      nock('/api/v1')
        .post(`/api/v1/users/${createdAdminData.data.id}/articles`, incompleteArticleData)
        .reply(200);
      chai.request(index)
        .post(`/api/v1/users/${createdAdminData.data.id}/articles`)
        .set('authorization', `${createdAdminData.token}`)
        .send(completeArticleData)
        .set('Accept', 'application/json')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.title).to.equal('Joy');
          expect(res.body.content).to.equal('Joy');
          expect(res.body.excerpt).to.equal('This is about that emotion that makes you want to shout and dance');
          expect(res.body.imageURL).to.equal('http://www.lifechurch242.org/wp-content/uploads/2016/01/Joy.jpg');
          done();
        });
    });
  });

  describe('list Function', () => {
    it('should return all Articles', (done) => {
      nock('/api/v1')
        .get(`/users/${createdUserData.data.id}/articles`)
        .reply(200);
      chai.request(index)
        .get(`/api/v1/users/${createdUserData.data.id}/articles`)
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('array');
          done();
        });
    });
  });

  describe('getOne Function', () => {
    it('should return an error if a user tries to fetch a non-existent article', (done) => {
      chai.request(index)
        .get(`/api/v1/users/${createdUserData.data.id}/articles/0`)
        .end((error, response) => {
          expect(response).to.have.status(404);
          expect(response.body).to.eql({ message: 'Article Not Found' });
          done();
        });
    });

    it('should return one article', (done) => {
      nock('/api/v1')
        .get(`/users/${createdUserData.data.id}/articles/${articleId}`)
        .reply(200, createdArticleData);
      chai.request(index)
        .get(`/api/v1/users/${createdUserData.data.id}/articles/${articleId}`)
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body.title).to.equal('Joy');
          expect(res.body.content).to.equal('Joy');
          expect(res.body.excerpt).to.equal('This is about that emotion that makes you want to shout and dance');
          expect(res.body.imageURL).to.equal('http://www.lifechurch242.org/wp-content/uploads/2016/01/Joy.jpg');
          done();
        });
    });
  });

  describe('update Function', () => {
    it('should return an error message when the token is not provided', (done) => {
      nock('/api/v1')
        .put(`/users/${createdAdminData.data.id}/articles/${articleId}`, { imageURL: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .reply(401);
      chai.request(index)
        .put(`/api/v1/users/${createdAdminData.data.id}/articles/${articleId}`)
        .send({ imageURL: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.eql('Token required for access');
          done();
        });
    });

    it('should return an error message when the user is not logged in', (done) => {
      nock('/api/v1')
        .put(`/users/${createdAdminData.data.id}/articles/${articleId}`, { imageURL: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .reply(401);
      chai.request(index)
        .put(`/api/v1/users/${createdAdminData.data.id}/articles/${articleId}`)
        .set('authorization', `${mockData.invalidToken}`)
        .send({ imageURL: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body.message).to.eql('Session expired. Please login to continue');
          done();
        });
    });

    it('should return an error message when a non admin user wants to update an article', (done) => {
      nock('/api/v1')
        .put(`/users/${createdUserData.data.id}/articles/${articleId}`, { imageURL: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .reply(403);
      chai.request(index)
        .put(`/api/v1/users/${createdUserData.data.id}/articles/${articleId}`)
        .set('authorization', `${createdUserData.token}`)
        .send({ imageURL: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.message).to.eql('Sorry, You are not authorized to perform this action');
          done();
        });
    });

    it('should update one article', (done) => {
      nock('/api/v1')
        .put(`/users/${createdAdminData.data.id}/articles/${articleId}`, { imageURL: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .reply(200);
      chai.request(index)
        .put(`/api/v1/users/${createdAdminData.data.id}/articles/${articleId}`)
        .set('authorization', `${createdAdminData.token}`)
        .send({ imageURL: 'http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg' })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.imageURL).to.eql('http://sisijemimah.com/wp-content/uploads/2015/12/Ofada-Stew-12-1024x683.jpg');
          done();
        });
    });
  });
  describe('delete Function', () => {
    it('should delete one article', (done) => {
      nock('/api/v1')
        .delete(`/users/${createdAdminData.data.id}/articles/${articleId}`)
        .reply(200);
      chai.request(index)
        .delete(`/api/v1/users/${createdAdminData.data.id}/articles/${articleId}`)
        .set('authorization', `${createdAdminData.token}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.message).to.eql('Article deleted.');
          done();
        });
    });

    it('should not delete an unsaved article', (done) => {
      nock('/api/v1')
        .delete(`/users/${createdAdminData.data.id}/articles/0`)
        .reply(500);
      chai.request(index)
        .delete(`/api/v1/users/${createdAdminData.data.id}/articles/0`)
        .set('authorization', `${createdAdminData.token}`)
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body.message).to.eql('Article Not Found');
          done();
        });
    });
  });
});
