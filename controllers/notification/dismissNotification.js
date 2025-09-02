const Response = require('../../lib/Response');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES } = require('../../config/Enum');
const { getUserFromJwt } = require('../../lib/getUserFromJwt');
const Notification = require('../../db/models/Notification');

exports.dismissNotification = async (req, res) => {
  const { id } = req.params;
  const { authorization } = req.headers;

  try {
    const user = await getUserFromJwt(authorization);
    if (!user) throw new CustomError(HTTP_CODES.NOT_FOUND, 'USER_NOT_FOUND');

    await Notification.updateOne(
      { _id: id, user: user.id },
      { $set: { is_dismissed: true } }
    );

    const ok = Response.successResponse({ success: true }, HTTP_CODES.OK);
    return res.status(ok.code).json(ok);
  } catch (error) {
    const errRes = Response.errorResponse(error);
    return res.status(errRes.code || 500).json(errRes);
  }
};
