const User = require('../../db/models/User.js');


// Kullanıcı arama (ID veya Username ile)
exports.searchUser = async (req, res) => {
  try {
    const { userId } = req.params; // Bu artık userId yerine searchTerm olarak düşünülebilir

    if (!userId) {
      return res.status(400).json({ error: "Kullanıcı ID veya kullanıcı adı gerekli" });
    }

    let user = null;
    
    // Önce ObjectId formatında mı kontrol et
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      // Geçerli ObjectId formatı - ID ile ara
      try {
        user = await User.findById(userId).select('-password -resetPasswordToken -passwordResetRequests');
      } catch (error) {
        // ObjectId hatası durumunda null döner
        console.log("ObjectId arama hatası:", error.message);
      }
    }
    
    // Eğer ID ile bulunamazsa veya geçersiz ID formatıysa, username ile ara
    if (!user) {
      user = await User.findOne({ 
        username: { $regex: new RegExp(`^${userId}$`, 'i') } // Case-insensitive exact match
      }).select('-password -resetPasswordToken -passwordResetRequests');
    }
    
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // Döndürülen veriyi frontend formatına uygun hale getir
    const userData = {
      userId: user._id.toString(),
      _id: user._id.toString(),
      username: user.username,
      name: user.name,
      surname: user.surname,
      fullName: `${user.name} ${user.surname}`,
      email: user.email,
      balance: user.balance || 0,
      avatar: user.avatar || "",
      status: user.status || "Active", // Varsayılan olarak Active
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error("❌ Search user hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};