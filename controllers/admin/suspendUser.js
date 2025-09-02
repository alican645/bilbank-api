const User = require('../../db/models/User.js');



// Kullanıcı hesabını askıya alma
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    user.status = "Suspended";
    await user.save();

    console.log(`⛔ Kullanıcı hesabı askıya alındı: ${user.email}`);

    res.status(200).json({
      message: "Kullanıcı hesabı askıya alındı",
      userId: user._id.toString(),
      status: user.status
    });
  } catch (error) {
    console.error("❌ Suspend user hatası:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Geçersiz kullanıcı ID formatı" });
    }
    
    res.status(500).json({ error: "Sunucu hatası" });
  }
};