const passport = require('passport');
const passportJWT = require('passport-jwt');
const bcrypt = require('bcrypt');
const config = require('../config/index');
const User = require('../db/models/User');


module.exports = () => {
    let strategy = new passportJWT.Strategy(
        {
            jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.JWT.SECRET

        },
        async (payload, done) => {
            let user = await User.findOne(payload.sub);

            try {

                if (user) {
                    done(null, {
                        id: user._id,
                        email: user.email,
                        is_active: user.is_active,
                        exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRE_TIME
                    })
                } else {
                    done(new Error('User not found'), null)
                }
            } catch (err) {
                done(err, null)
            }
        }
    )

    passport.use(strategy);

    return{
        initialize : () => passport.initialize(),
        authenticate : () => passport.authenticate('jwt', { session: false })
    }
}

