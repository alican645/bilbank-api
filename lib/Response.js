const CustomError = require("./CustomError");
const Enum = require("../config/Enum");


class Response {
    constructor() {

    }

    static successResponse(data, code = 200) {
        return {
            code: code,
            data: data,
        }
    }

    static errorResponse(error, code = 500) {
        if (error instanceof CustomError) {
            return {
                code: error.code,
                error: {
                    message: error.message,
                    description: error.description
                },
            }
        }else{
            if(error.message.includes('E11000')){
                return {
                code: Enum.HTTP_CODES.CONFLICT,
                error: {
                    message: 'Allready exists',
                    description: 'This data already exists in the database. Please check your input and try again.'
                },
            }
            }
        }
        return {
                code: Enum.HTTP_CODES.INT_SERVER_ERROR,
                error: {
                    message: error.message,
                    description: error.description
                },
            }

    }
}

module.exports = Response;