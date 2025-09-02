const User = require('../../db/models/User.js');



// ✅ YENİ EKLENEN: Kullanıcı bakiyesi getirme (real-time için)
exports.getUserBalance = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "Kullanıcı ID gerekli" });
    }

    let user = null;
    
    // Önce ObjectId formatında mı kontrol et
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        user = await User.findById(userId).select('balance');
      } catch (error) {
        console.log("ObjectId arama hatası:", error.message);
      }
    }
    
    // Eğer ID ile bulunamazsa username ile ara
    if (!user) {
      user = await User.findOne({ 
        username: { $regex: new RegExp(`^${userId}$`, 'i') } 
      }).select('balance');
    }
    
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    res.status(200).json({
      userId: user._id.toString(),
      balance: user.balance || 0
    });
  } catch (error) {
    console.error("❌ Get user balance hatası:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Geçersiz kullanıcı ID formatı" });
    }
    
    res.status(500).json({ error: "Sunucu hatası" });
  }
};