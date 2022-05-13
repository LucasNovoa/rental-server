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

    const link = `http://localhost:3000/changePassword?token=${token}`;

    await service.update(user.id, { recoveryToken: token });

    const mail = {
      from: config.smtpEmail,
      to: `${user.email}`,
      subject: 'Email to Recovery Password',
      html: `<b>Ingresa a este Link => <a href="${link}">${link}</a></b>`,
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
