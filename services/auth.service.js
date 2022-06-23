const boom = require('@hapi/boom');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer');

const { config } = require('../config/config');

const UserService = require('./user.service');

const service = new UserService();

class AuthService {
  constructor() {}

  async getUser(email, password) {
    const user = await service.findByEmail(email);

    if (!user) {
      throw boom.unauthorized();
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw boom.unauthorized();
    }

    delete user.dataValues.password;

    return user;
  }

  signToken(user) {
    const payload = {
      sub: user.id,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwtSecret);

    return { user, token };
  }

  async sendRecoveryPassword(email) {
    const user = await service.findByEmail(email);

    if (!user) {
      throw boom.unauthorized();
    }

    const payload = { sub: user.id };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '15min' });

    const link = `https://rental-bookings.netlify.app/changePassword?token=${token}`;

    await service.update(user.id, { recoveryToken: token });

    const mail = {
      from: config.smtpEmail,
      to: `${user.email}`,
      subject: 'Rental App • Cambiar Contraseña',
      html: `<h4>Hola ${user.organization || user.firstName},</h4>
      <p>Hemos recibido una solicitud para cambiar tu contraseña. Puedes hacerlo haciendo click <a href="${link}">aquí</a>.</p>
      <p>Si no has sido tú quien realizó el pedido desestima este correo.</p><br/>     
      <p>Te esperamos en tu próxima reserva!</p>
      <a href='https://rental-bookings.netlify.app/'>Ir a Rental-App</a>`,
    };

    const rta = await this.sendMail(mail);

    return rta;
  }

  async changePassword(token, newPassword) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);

      const user = await service.findById(payload.sub);

      if (user.recoveryToken !== token) {
        throw boom.unauthorized();
      }

      const hash = await bcrypt.hash(newPassword, 10);

      await service.update(user.id, { recoveryToken: null, password: hash });

      return { message: 'Password Changed' };
    } catch (error) {
      throw boom.unauthorized();
    }
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

    return { message: 'Mail Sent' };
  }
}

module.exports = AuthService;
