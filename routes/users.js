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

    if (!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED,);

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


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body; validateLogin({ email, password }); // ayrı fonksiyon 
    console.log("validate işleminden geçti");

    const user = await Users.findOne({ email });
    if (!user) {
      throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "invalid_credentials", "Email or password is incorrect.");
    }

    console.log("Kullanıcı bulundu")
    console.log(password)
    console.log(user.password)

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) { throw new CustomError(
      Enum.HTTP_CODES.UNAUTHORIZED,
       "invalid_credentials",
        "Email or password is incorrect."); }

    const payload = { id: user._id.toString(), exp: Math.floor(Date.now() / 1000) + config.JWT.EXPIRE_TIME };
    const token = jwt.encode(payload, config.JWT.SECRET);
    return res.json(Response.successResponse({ 
      access_token: token, 
      token_type: "Bearer", 
      expires_in: 
      config.JWT.EXPIRE_TIME,
    }));
  } catch (err) {
    const errorResponse = Response.errorResponse(err); 
    res.status(errorResponse.code).json(errorResponse); 
  }
});

// controllers/auth.js (örnek)

router.post('/register', async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      first_name,
      last_name,
      birth_date
    } = req.body;

    // Doğrulama fonksiyonun varsa kullan
    validateUserRegister?.({ email, username, password });

    // Kullanıcı oluştur
    const user = new Users({
      email: email.trim(),
      username: username.trim(),
      password: password.trim(),  // hash pre-save middleware ile
      first_name: first_name?.trim(),
      last_name: last_name?.trim(),
      birth_date: new Date(birth_date), // "yyyy-MM-dd" string bekleniyor
    });

    await user.save();

    return res
      .status(Enum.HTTP_CODES.CREATED)
      .json(
        Response.successResponse(
          { success: true },
          Enum.HTTP_CODES.CREATED
        )
      );

  } catch (err) {
    const errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code || 500).json(errorResponse);
  }
});

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

function validateLogin({ email, password }) {
  if (!email) {
    throw new CustomError(
      Enum.HTTP_CODES.BAD_REQUEST,
      "email_required",
      "Email is required."
    );
  }

  // basit regex format kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new CustomError(
      Enum.HTTP_CODES.BAD_REQUEST,
      "email_invalid",
      "Email format is invalid."
    );
  }

  if (!password) {
    throw new CustomError(
      Enum.HTTP_CODES.BAD_REQUEST,
      "password_required",
      "Password is required."
    );
  }
}



module.exports = router;

