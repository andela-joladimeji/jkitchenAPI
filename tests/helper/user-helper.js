const chai = require('chai');
const index = require('../../app');
chai.use(require('chai-http'));
const User = require('../../models').User;
const nock = require('nock')

module.exports = {
  getUserToken: (data) => {
    return User
      .find({where: {email:data.email}})
      .then(user => {
        if (user) {
          console.log('user found')
          user.destroy()
        }
      })
    .then(() => {
    return new Promise((resolve, reject) => {
      nock('/api/v1')
        .get('/user/signup')
        .reply(200, (uri, data) => {
          return data;
      });
      chai.request(index)
        .post('/api/v1/user/signup')
        .send(data)
        .end((error, response) => {
          if (error) {
            return reject({ message: error });
          }
          return resolve(response.body);
        });
      })
    });
  },
  loginUser: (data) => {
    return new Promise((resolve, reject) => {
      chai.request(index)
        .post('/api/v1/user/signin')
        .send(data)
        .end((error, response) => {
          if (error) {
            return reject({ message: error });
          }
          return resolve(response.body);
        });
    });
  },
};