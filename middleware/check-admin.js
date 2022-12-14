const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new HttpError("Admin authentication failed", 403);
    }
    const decodedToken = jwt.verify(token, process.env.JWT_PRIVATE);
    req.userData = {
      userId: decodedToken.userId,
      isAdmin: decodedToken.isAdmin,
    };

    if (!decodedToken.isAdmin) {
      const error = new HttpError("Admin authentication failed", 403);
      return next(error);
    }
    next();
  } catch (err) {
    const error = new HttpError("Admin authentication failed", 403);
    return next(error);
  }
};
