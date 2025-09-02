
const Room = require('../../db/models/Room.js');




// Yeni oda oluştur
export const createRoom = async (req, res) => {
  try {
    const { name, prize, entryFee, maxParticipants, minParticipants } = req.body;

    if (!name || prize == null || entryFee == null || !maxParticipants) {
      return res.status(400).json({ error: "Eksik alanlar var" });
    }

    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(409).json({ error: "Bu isimde bir oda zaten var" });
    }

    const room = await Room.create({
      name,
      prize,
      entryFee,
      maxParticipants,
      minParticipants: minParticipants || 2
    });

    res.status(201).json({
      message: "Oda başarıyla oluşturuldu",
      room
    });
  } catch (error) {
    console.error("❌ createRoom error:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

// Tüm odaları getir
export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ prize: 1 });
    res.status(200).json(rooms);
  } catch (error) {
    console.error("❌ getAllRooms error:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

// Oda güncelle
export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const updates = req.body;

    const updatedRoom = await Room.findByIdAndUpdate(roomId, updates, { new: true });

    if (!updatedRoom) {
      return res.status(404).json({ error: "Oda bulunamadı" });
    }

    res.status(200).json({
      message: "Oda güncellendi",
      room: updatedRoom
    });
  } catch (error) {
    console.error("❌ updateRoom error:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};

// Oda sil
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const deletedRoom = await Room.findByIdAndDelete(roomId);

    if (!deletedRoom) {
      return res.status(404).json({ error: "Oda bulunamadı" });
    }

    res.status(200).json({
      message: "Oda silindi",
      roomId: deletedRoom._id
    });
  } catch (error) {
    console.error("❌ deleteRoom error:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
};