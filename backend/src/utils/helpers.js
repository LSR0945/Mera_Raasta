import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, config.jwtAccessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, config.jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token) => jwt.verify(token, config.jwtRefreshSecret);
