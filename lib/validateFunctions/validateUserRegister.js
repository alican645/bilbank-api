const CustomError = require('../CustomError');
const Enum = require('../../config/Enum');
const is = require('is_js');

module.exports = function validateUserRegister(body){
  if (!body.email) throw new CustomError(
      Enum.HTTP_CODES.BAD_REQUEST,
      'Email is required',
      'Email is required in the request body'

    )

    if (!body.password) throw new CustomError(
      Enum.HTTP_CODES.BAD_REQUEST,
      'Password is required',
      'Password is required in the request body')

    if (is.not.email(body.email)) throw new CustomError(
      Enum.HTTP_CODES.BAD_REQUEST,
      'Invalid email',
      'Invalid email format'
    )

    if (body.password.length < 8) throw new CustomError(
      Enum.HTTP_CODES.BAD_REQUEST,
      'Password must be at least 9 characters',
      'Password must be at least 9 characters'
    )
}
