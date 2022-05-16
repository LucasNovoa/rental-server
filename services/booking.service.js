const boom = require('@hapi/boom');
const nodemailer = require('nodemailer');
const mercadopago = require('mercadopago');
const { models } = require('../libs/sequelize');
const { config } = require('../config/config');

class BookingService {
  constructor() {}

  async find() {
    const allBookings = await models.Booking.findAll();

    if (!allBookings) {
      throw boom.notFound('Bookings Not Found');
    }

    return allBookings;
  }

  async findById(id) {
    const booking = await models.Booking.findByPk(id, {
      include: [models.Hotel, models.User, models.Billing],
    });

    if (!booking) {
      throw boom.notFound('Booking Not Found');
    }

    return booking;
  }

  async create(body) {
    const { email, organization, firstName } = await models.User.findByPk(body.UserId);
    const hotelData = await models.Hotel.findByPk(body.HotelId);
    const { mainImage, name, price } = hotelData.dataValues;
    const newBooking = await models.Booking.create({
      ...body,
      mainImage,
      hotelName: name,
      pricePerNight: price,
      nights: body.checkOut.slice(0, 2) - body.checkIn.slice(0, 2),
    });
    const {
      id, checkIn, checkOut, nights, pricePerNight,
    } = newBooking.dataValues;
    const totalPrice = nights * pricePerNight;
    const setExpDateFrom = new Date(new Date().setHours(new Date().getHours() - 3)).toJSON();
    const expDateFrom = `${setExpDateFrom.slice(0, 23)}-03:00`;
    const setExpDateTo = new Date(new Date().setHours(new Date().getHours() + 1)).toJSON();
    const expDateTo = `${setExpDateTo.slice(0, 23)}-03:00`;

    mercadopago.configure({ access_token: config.accessToken });
    const preference = {
      items: [
        {
          title: 'Tu reserva en RentalApp',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: totalPrice,
        },
      ],
      back_urls: {
        success: 'https://rental-app-client.netlify.app',
        failure: 'https://rental-app-client.netlify.app/profile',
        pending: 'https://rental-app-client.netlify.app/profile',
      },
      auto_return: 'approved',
      payment_methods: {
        // excluded_payment_methods: [
        //   {
        //     id: 'master',
        //   },
        // ],
        excluded_payment_types: [
          {
            id: 'ticket',
          },
        ],
        installments: 1,
      },
      statement_descriptor: 'RENTALAPP',
      external_reference: 'Rental_Bookings',
      expires: true,
      expiration_date_from: expDateFrom,
      expiration_date_to: expDateTo,
    };

    const payment = await mercadopago.preferences.create(preference);
    // console.log(payment);
    const { init_point } = payment.body;
    const booking = await this.update(id, { initPointMP: init_point });

    const mail = {
      from: 'bookings@rental.com',
      to: `${email}`,
      subject: `Felicitaciones ${organization || firstName}, tu pre-reserva esta generada!`,
      html: `<h4>Hola ${organization || firstName}, tienes una pre-reserva en ${name} en espera de confirmación</h4>
      <p>Ingresa a este <a href=${payment.body.init_point}>link</a> para realizar el pago y finalizar la reserva</p>
      <p>Estas son las fechas elegidas:</p>
      <p>Check In: ${checkIn} a las 13 hs. hora local</p>
      <p>Check Out: ${checkOut} a las 10 hs. hora local</p>
      <p>Monto a pagar: ${totalPrice}</p>
      <p>Muchas gracias!</p>
      <a href='https://rental-app-client.netlify.app/profile'>Ir a tu perfil en Rental App para ver tus reservas</a>`,
    };

    await this.sendMail(mail);

    return booking;
  }

  async delete(id, body) {
    const booking = await this.findById(id);

    const bookingDeleted = await booking.update(body);

    return bookingDeleted;
  }

  async order({ prop, value }) {
    if (!prop && !value) {
      throw boom.notFound('Query Not Found');
    }
    const orderedBookings = await models.Booking.findAll({
      order: [[prop, value]],
    });
    return orderedBookings;
  }

  async filter(body) {
    const payload = Object.entries(body);

    if (!payload) {
      throw boom.notFound('Body Not Found');
    }

    const attributes = payload.map((p) => {
      const obj = { [p[0]]: p[1] };
      return obj;
    });

    const filteredBookings = await models.Booking.findAll({ where: attributes });

    return filteredBookings;
  }

  async update(id, body) {
    const booking = await this.findById(id);

    const updatedBooking = await booking.update(body);

    return updatedBooking;
  }

  async sendMail(infoMail) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: config.smtpEmail,
        pass: config.smtpPassword,
      },
    });

    await transporter.sendMail(infoMail);

    return { message: 'New User Mail Sent' };
  }
}

module.exports = BookingService;
