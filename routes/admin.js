const express = require('express');
const router = express.Router();

// ===================== Middleware =====================
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== '2D17cFa729011') {
    return res.status(401).json({ error: "Yetkisiz erişim" });
  }
  next();
};

// ===================== Controllers =====================
// Kullanıcı işlemleri
const { getAllUsers } = require('../controllers/admin/getAllUsers');
const { searchUser } = require('../controllers/admin/searchUser');
const { deleteUser } = require('../controllers/admin/deleteUser');
const { suspendUser } = require('../controllers/admin/suspendUser');
const { activateUser } = require('../controllers/admin/activeUser');
const { addBalance } = require('../controllers/admin/addBalance');
const { subtractBalance } = require('../controllers/admin/subtractBalance');
const { getUserBalance } = require('../controllers/admin/getUserBalance');

// Soru işlemleri
const { uploadQuestions } = require('../controllers/admin/uploadQuestions');

// Oda işlemleri
const { createRoom } = require('../controllers/rooms/createRoom');
const { sendNotification } = require('../controllers/notification/sendNotification');


// TODO alican: BUNLAR YAPILACAK
// const { getAllRooms } = require('../controllers/admin/getAllRooms');
// const { updateRoom } = require('../controllers/admin/updateRoom');
// const { deleteRoom } = require('../controllers/admin/deleteRoom');


// ===================== Routes =====================
// 📦 Kullanıcı İşlemleri
router.get("/users", adminAuth, getAllUsers);
router.get("/users/:userId", adminAuth, searchUser);
router.delete("/users/:userId", adminAuth, deleteUser);
router.put("/users/:userId/suspend", adminAuth, suspendUser);
router.put("/users/:userId/activate", adminAuth, activateUser);
router.post("/users/:userId/add-balance", adminAuth, addBalance);
router.post("/users/:userId/subtract-balance", adminAuth, subtractBalance);
//TODO admin auth eklenecek
router.post("/sendNotification", sendNotification)
router.get("/balance/realtime/:userId", adminAuth, getUserBalance);

// 📚 Soru Yükleme
router.post("/upload-questions", adminAuth, uploadQuestions);

// 🏠 Oda Yönetimi
router.post("/createRoom", adminAuth, createRoom);

// TODO alican: BUNLAR YAPILACAK
// router.get("/rooms", adminAuth, getAllRooms);
// router.put("/rooms/:roomId", adminAuth, updateRoom);
// router.delete("/rooms/:roomId", adminAuth, deleteRoom);


// ===================== Export =====================
module.exports = router;
