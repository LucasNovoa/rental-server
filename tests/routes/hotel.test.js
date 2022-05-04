const request = require('supertest');
const app = require('../../app');
const { models } = require('../../libs/sequelize');
const HotelService = require('../../services/hotel.service');

const mockService = new HotelService();

const mockedHotel = {
  name: 'hotel1',
  description: 'soy una prueba',
  ranking: 4,
  price: 10,
  countryCode: 'test',
  latitude: 0,
  longitude: 0,
  address: 'fake st 123',
  city: 'fake city',
  postalCode: '7890',
  phones: '123455344747',
  children: 0,
  maxPax: 2,
};

xdescribe('Hotel routes:', () => {
  beforeEach(() => models.Hotel.sync({ force: true }).then(() => mockService.create(mockedHotel)));
  describe('GET /', () => {
    test('should be a 200', async () => await request(app).get('/api/v1/hotels').expect(200));
    test('should be a json', async () => await request(app).get('/api/v1/hotels').expect(200).expect('Content-Type', /application\/json/));
  });
  describe('GET / query name', () => {
    test('should return an hotel that match with the query params', async () => {
      const response = await request(app).get('/api/v1/hotels?name=hotel1');
      expect(response.body.name).toEqual(mockedHotel.name);
    });
  });
});
