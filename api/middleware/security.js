const { Logger } = require("../logging");
const config = require("../config");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const SALT_ROUND = 10; 

function send401Response(res) {
    res.status(401).send({message: "User not authenticated"});
}

function send403Response(res) {
    res.status(403).send({message: "User is not authorized to access this resource"});
}

module.exports = {
    allowedRoles: (authorizedRoles=["user", "driver", "admin"]) => {
        return (req, res, next) => {
            const authHeaderContent = req.get("Authorization");
            if (!authHeaderContent) {
                send401Response(res);
                return;
            }
            try {
                const decoded = jwt.verify(authHeaderContent.replace("Bearer ", ""), config.APP_SECRET);
                if (!authorizedRoles.includes(decoded.role)) {
                    send403Response(res);
                    return
                }
                req.userId = decoded.userId;
            } catch (error) {
                send401Response(res);
                return;
            }
            next();
        }
    },
    hashPassword: async (password) => {
        try {
            const salt = await bcrypt.genSalt(SALT_ROUND);
            const hash = await bcrypt.hash(password, salt);
            return hash;
        } catch (error) {
            Logger.debug('Errore nell\'hashing della password:', error);
        }
    },
    verifyPassword: async (password, hash) => {
        try {
            const match = await bcrypt.compare(password, hash);
            return match;
        } catch (error) {
            Logger.debug('Errore nella verifica della password:', error);
        }
    },
    socketAllowedRoles: (authorizedRoles=["user", "driver", "admin"]) => {
        return (socket, next) => {
            const authHeaderContent = socket.request.headers.authorization || socket.handshake.auth.token
            if (!authHeaderContent) {
                next(new Error("User not authenticated"))
                return;
            }
            try {
                const decoded = jwt.verify(authHeaderContent.replace("Bearer ", ""), config.APP_SECRET);
                Logger.debug(decoded.role)
                if (!authorizedRoles.includes(decoded.role)) {
                    next(new Error("User not authorized"))
                    return
                }
            } catch (error) {
                next(new Error("User not authenticated"))
                return;
            }
            next();
        }
    },
}