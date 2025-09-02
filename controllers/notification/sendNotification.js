const Response = require('../../lib/Response');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES } = require('../../config/Enum');
const Notification = require('../../db/models/Notification');
const User = require('../../db/models/User');

exports.sendNotification = async (req, res) => {
  const { user_id, title, body } = req.body;
  console.log(req.body);
  try {
    if (!user_id || !title || !body) {
      throw new CustomError(HTTP_CODES.BAD_REQUEST, 'user_id, title ve body zorunludur.');
    }

    let user = await User.findById(user_id).lean();
    if (!user) {
      throw new CustomError(HTTP_CODES.NOT_FOUND, 'Kullanıcı bulunamadı.');
    }

    const notification = await Notification.create({
      user_id: user._id,
      title,
      body
    });
    


    const ok = Response.successResponse(notification, HTTP_CODES.CREATED);
    return res.status(ok.code).json(ok);
  } catch (error) {
    const errRes = Response.errorResponse(error);
    return res.status(errRes.code || 500).json(errRes);
  }
};