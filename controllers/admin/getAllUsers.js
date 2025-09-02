const User = require('../../db/models/User.js');


// Tüm kullanıcıları listeleme (sayfalama ile)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-password -resetPasswordToken -passwordResetRequests')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    const formattedUsers = users.map(user => ({
      userId: user._id.toString(),
      _id: user._id.toString(),
      username: user.username,
      name: user.name,
      surname: user.surname,
      fullName: `${user.name} ${user.surname}`,
      email: user.email,
      balance: user.balance || 0,
      avatar: user.avatar || "",
      status: user.status || "Active",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.status(200).json({
      users: formattedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers: totalUsers,
        hasNextPage: page < Math.ceil(totalUsers / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("❌ Get all users hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};
