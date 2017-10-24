const faker = require('faker');
const auth = require('../middleware/authentication');

module.exports = {
  userData: { 
    username: 'James Egypt', 
    password: '$123d32#hdsjsd', 
    name: 'James', 
    email: faker.internet.email(), 
    phoneNumber:'2349039033', 
    id: 1,
    token: auth.generateToken({id: 1}) 
  },
  adminUser: {
    username: 'admin01',
    name: 'admin user',
    email: faker.internet.email(),
    password: 'admintester1',
    role: 'admin',
    id: 2,
    token: auth.generateToken({id: 2})
  },
  testUser: {
    id: 23,
    username: 'test01',
    name: 'test user',
    email: faker.internet.email(),
    hashedPassword: 'tester',
  },
  invalidUserDetails: {
    username: 'Jim',
    name: 'Jim Rim',
    email: faker.internet.email(),
    hashedPassword: '$w2eker',
  },
  invalidToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZUlkIjoyLCJpYXQiOjE0OTM2MjQ5MTcsImV4cCI6MTQ5MzcxMTMxN30.A3dy4bPUEa3QsML03UKDjqC9wcmAjV0ub8aWu1niaL'
};
