const User = require('../../db/models/User.js');



// Kullanıcı bakiyesi çıkarma
exports.subtractBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Geçerli bir miktar giriniz" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    const oldBalance = user.balance || 0;
    const newBalance = Math.max(0, oldBalance - Number(amount)); // Negatif bakiye önlenir

    user.balance = newBalance;
    await user.save();

    console.log(`💸 Bakiye çıkarıldı - User: ${user.username}, Eski: ${oldBalance}, Yeni: ${user.balance}, Çıkarılan: ${amount}`);

    res.status(200).json({
      message: `${amount} elmas başarıyla çıkarıldı`,
      userId: user._id.toString(),
      oldBalance: oldBalance,
      newBalance: user.balance,
      subtractedAmount: Number(amount)
    });
  } catch (error) {
    console.error("❌ Subtract balance hatası:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Geçersiz kullanıcı ID formatı" });
    }
    
    res.status(500).json({ error: "Sunucu hatası" });
  }
};