const Response = require('../../lib/Response');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES } = require('../../config/Enum');
const Notification = require('../../db/models/Notification');
const { getUserFromJwt } = require('../../lib/getUserFromJwt');


exports.getNotificationCount = async (req, res) => {
  const { authorization } = req.headers;

  try {
    const user = await getUserFromJwt(authorization);
    if (!user) throw new CustomError(HTTP_CODES.UNAUTHORIZED, 'USER_NOT_FOUND');

    const count = await Notification.countDocuments({
      user_id: user.id,
      is_dismissed: false ,
      is_read: false,
    });

    const ok = Response.successResponse({ count }, HTTP_CODES.OK);
    return res.status(ok.code).json(ok);
  } catch (error) {
    const errRes = Response.errorResponse(error);
    return res.status(errRes.code || 500).json(errRes);
  }
};