const request = require('supertest');
const app = require('../../app');
const { models } = require('../../libs/sequelize');
const mockedService = require('../../services/user.service');

const mockedUser = {
  name: 'prueba1',
  lastName: 'test1',
  userName: 't3st1',
  email: 't3st1@mail.com',
  birthDate: '123441',
  password: 'asdasdasdad',
  repeatPassword: 'asdasdasdad',
};

describe('User routes:', () => {
  beforeEach(() => models.User.sync().then(() => mockedService.create(mockedUser)));
  describe('GET /users', () => {
    test('should be a 200', async () => {
      await request(app).get('/api/v1/users').expect(200);
    });
    test('should be json', async () => {
      await request(app).get('/api/v1/users').expect('Content-Type', /application\/json/);
    });
  });
});
