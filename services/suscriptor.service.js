const boom = require('@hapi/boom');
const nodemailer = require('nodemailer');
const { models } = require('../libs/sequelize');
const { config } = require('../config/config');

class SuscriptorService {
  constructor() {}

  async find() {
    const allSuscriptors = await models.Suscriptor.findAll();

    return allSuscriptors;
  }

  async findByMail(mail) {
    const suscriptor = await models.Suscriptor.findOne({
      where: { mail },
    });

    return suscriptor;
  }

  async findById(id) {
    const suscriptor = await models.Suscriptor.findByPk(id);

    if (!suscriptor) {
      throw boom.notFound('User Not Found');
    }

    return suscriptor;
  }

  async create(email) {
    const newSuscriptor = await models.Suscriptor.create(email);

    const mail = {
      from: 'rental@rental.com',
      to: `${newSuscriptor.email}`,
      subject: 'Bienvenido a la suscripción de newsletters de Rental App!',
      html: `<h4>Hola, gracias por suscribirte a Rental App!</h4>
      <p>En Rental encontrarás una variada gama de hospedajes para que tu viaje sea una experiencia única.</p>
      <p>Y si dispones de una propiedad para alquiler, no dudes en sumarte para aprovechar nuestra gran red de inquilinos y viajeros!</p>
      <a href='https://rental-bookings.netlify.app/'>Visita Rental-App y encontra lo que estas buscando!</a>`,
    };

    await this.sendMail(mail);

    return newSuscriptor;
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

    return { message: 'New Suscriptor Mail Sent' };
  }

  async update(id, body) {
    const suscriptor = await this.findById(id);

    if (!suscriptor) {
      throw boom.notFound('User Not Found');
    }

    const updatedSuscriptor = await suscriptor.update(body);

    return updatedSuscriptor;
  }

  async getAllSuscriptors() {
    const users = await models.User.findAll({
      where: {
        isSuscribed: true,
      },
    });
    const suscriptors = await models.Suscriptor.findAll({
      where: {
        isSuscribed: true,
      },
    });
    const recipients = users.concat(suscriptors);

    return recipients;
  }

  async sendMonthlyMails() {
    const recipients = await this.getAllSuscriptors();
    recipients.map((r) => r.email).map(async (suscriptor) => {
      const mail = {
        from: 'rental@rental.com',
        to: suscriptor,
        subject: 'Tu Newsletter mensual de parte de Rental App!',
        html: `<h4>Hola, te dejamos a disposición nuestras últimas novedades y artículos de interés.</h4>
        <p>En Rental encontrarás una variada gama de hospedajes para que tu viaje sea una experiencia única.</p>
        <p>Y si dispones de una propiedad para alquiler, no dudes en sumarte para aprovechar nuestra gran red de inquilinos y viajeros!</p>
        <a href='https://rental-bookings.netlify.app/'>Visita Rental-App y encontra lo que estas buscando!</a>`,
      };
      await this.sendMail(mail);
    });
  }
}

module.exports = SuscriptorService;
