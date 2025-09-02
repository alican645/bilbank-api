const User = require('../../db/models/User.js');



// Kullanıcı silme
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "Kullanıcı ID gerekli" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    await User.findByIdAndDelete(userId);

    console.log(`🗑️ Kullanıcı silindi: ${user.email} (${user.username})`);

    res.status(200).json({
      message: "Kullanıcı başarıyla silindi",
      deletedUser: {
        userId: user._id.toString(),
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("❌ Delete user hatası:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Geçersiz kullanıcı ID formatı" });
    }
    
    res.status(500).json({ error: "Sunucu hatası" });
  }
};