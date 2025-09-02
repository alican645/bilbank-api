
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
        WAITING: 0, RUNNING: 1, CLOSED: 2
    }),
    ReservationStatus: Object.freeze({ RESERVED: 0, CANCELLED: 1, FINISHED: 2 }),
    ANSWER_RESULT: Object.freeze({
        OK: 'OK',
        MISSING_PARAMS: 'MISSING_PARAMS',
        UNAUTHORIZED: 'UNAUTHORIZED',
        DUPLICATE_ANSWER: 'DUPLICATE_ANSWER',
        QUESTION_NOT_FOUND: 'QUESTION_NOT_FOUND',
        SERVER_ERROR: 'SERVER_ERROR',
    })

}