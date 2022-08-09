const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const getJWTPrivateKey = require("../dev-files/dev-files").getJWTPrivateKey;

module.exports = (req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next();
    }
    try {
      const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
      if (!token) {
        throw new Error('Authentication failed');
      }
      const decodedToken = jwt.verify(token, getJWTPrivateKey());
      req.userData = { userId: decodedToken.userId, isAdmin: decodedToken.isAdmin };
      next();
    } catch (err) {
      const error = new HttpError('Authentication failed', 403);
      return next(error);
    }
  };
