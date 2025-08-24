// controllers/rooms/cancelReservation.js
exports.cancelReservation = async (req, res) => {
  const { reservation_id } = req.params;
  const userId = req.user?._id || req.userId;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const reservation = await RoomReservation.findOne({
        _id: reservation_id,
        user: userId,
        active: true,
      }).session(session);

      if (!reservation) {
        const err = new Error('Active reservation not found');
        err.code = 404;
        throw err;
      }

      // Rezervasyonu pasifleştir
      reservation.active = false;
      reservation.status = ReservationStatus.CANCELED;
      await reservation.save({ session });

      // Oda user_count -1
      await Room.findByIdAndUpdate(
        reservation.room,
        { $inc: { user_count: -1 } },
        { session }
      );

      return res.json({ success: true });
    });
  } catch (error) {
    return res.status(error.code || 400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
