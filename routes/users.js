var express = require('express');
var router = express.Router();

const jwt = require('jwt-simple');

const bcrypt = require('bcrypt');

const validateUserRegister = require('../lib/validateFunctions/validateUserRegister');
const Users = require('../db/models/User');
const Response = require('../lib/Response');
const Enum = require('../config/Enum');
const config = require('../config/index');
const CustomError = require('../lib/CustomError');
const Auth = require('../lib/auth')();

router.post("/auth", async (req, res) => {
  try {

    let { email, password } = req.body;

    validateUserRegister({ email, password });

    let user = await Users.findOne({ email });

    if (!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, );

    if (!user.validPassword(password)) 
      throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED,
      "Password is incorrect",
      "Password is incorrect");

    let payload = {
      id: user._id,
      exp: parseInt(Date.now() / 1000) + config.JWT.EXPIRE_TIME
    }

    let token = jwt.encode(payload, config.JWT.SECRET);

    let userData = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name
    }

    res.json(Response.successResponse({ token, user: userData }));

  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
})


router.post('/register', async (req, res, next) => {
  let body = req.body;

  try {

    validateUserRegister(body);

    let hashPassword = await bcrypt.hash(body.password, 10);

    let user = new Users({
      email: body.email,
      password: hashPassword,
    });

    await user.save();

    res.status(Enum.HTTP_CODES.CREATED)
      .json(Response.successResponse(
        { success: true, user_id: user._id },
        Enum.HTTP_CODES.CREATED));
  } catch (err) {
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(Response.errorResponse(err));
  }

})

router.all('*', Auth.authenticate(), async (req, res, next) => {
  next();
})

router.get('/', async (req, res, next) => {
  let users = await Users.find({});
  try {
    res.json(Response.successResponse(users));
  } catch (error) {
    res.json(Response.errorResponse(error));
  }
});



module.exports = router;

