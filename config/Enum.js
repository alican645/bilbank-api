const User = require("../db/models/User");

module.exports = {
    HTTP_CODES: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        NOT_MODIFIED: 304,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_ALLOWED: 405,
        NOT_ACCEPTABLE: 406,
        TIMED_OUT: 408,
        CONFLICT: 409,
        GONE: 410,
        UNSUPPORTED_MEDIA_TYPE: 415,
        UNPROCESSIBLE_ENTITY: 422,
        TOO_MANY_REQUESTS: 429,
        INT_SERVER_ERROR: 500,
        BAD_GATEWAY: 502
    },
    RoomTypes: Object.freeze({
        UCRETSIZ: 0,      // Ücretsiz
        BRONZ: 1,     // Bronz
        GUMUS: 2,     // Gümüş
        ALTIN: 3,     // Altın
        ELMAS: 4,     // Elmas
        PLATIN: 5,
        ZUMRUT: 6,
        PALLADYUM: 7       // En üst seviye (örnek isim)
    }),
    EntryStatus: Object.freeze({
        ROOM_APPLICATION_OPEN: 1,      // Oda başvuruya açık (kullanıcı başvuru yapabilir)
        ROOM_IN_PROGRESS: 2,           // Oda şu an çalışmakta / aktif oyun var
        ROOM_CLOSED: 3,                // Oda kapalı, giriş yapılamaz
    }),
    UserEntryStatus: Object.freeze({
        User_Waiting: {
            valueOf: 0,
            description: "Başvurunuz alındı oda açılınca oyuna girebilirsiniz"
        },
        User_Direct_Entry: {
            valueOf: 1,
            description: "Lütfent bekleyiniz, odaya giriş yapıyorsunuz"
        },
        User_No_Entry: {
            valueOf: 2,
            description: "Odaya giriş yapamazsınız"
        }

    })

}