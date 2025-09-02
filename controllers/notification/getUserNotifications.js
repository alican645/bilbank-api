const Response = require('../../lib/Response');
const CustomError = require('../../lib/CustomError');
const { HTTP_CODES } = require('../../config/Enum');
const { getUserFromJwt } = require('../../lib/getUserFromJwt');
const Notification = require('../../db/models/Notification');

exports.getUserNotifications = async (req, res) => {
  const { authorization } = req.headers;

  try {
    const user = await getUserFromJwt(authorization);
    if (!user) throw new CustomError(HTTP_CODES.NOT_FOUND, 'USER_NOT_FOUND');

    // 1. Bildirimleri çek (dismissed hariç)
    const notifications = await Notification.find({
      user_id: user,
      is_dismissed: false,
    }).sort({ created_at: -1 });

    console.log(notifications);

    // 2. is_read = false olanları topla
    const unreadIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n._id);

    console.log(unreadIds);


    // 3. Hepsini okundu işaretle (bulk update)
    if (unreadIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: unreadIds } },
        { $set: { is_read: true } }
      );
    }

    const ok = Response.successResponse(notifications, HTTP_CODES.OK);
    console.log(ok);
    return res.status(ok.code).json(ok);
  } catch (error) {
    const errRes = Response.errorResponse(error);
    return res.status(errRes.code || 500).json(errRes);
  }
};
