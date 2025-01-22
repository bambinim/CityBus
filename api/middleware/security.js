const { Logger } = require("../logging");
const config = require("../config");
const jwt = require("jsonwebtoken");

function send401Response(res) {
    res.status(401).send({message: "User not authenticated"});
}

function send403Response(res) {
    res.status(403).send({message: "User is not authorized to access this resource"});
}

module.exports = {
    allowedRoles: (authorizedRoles=["user", "driver", "admin"]) => {
        Logger.debug("Authorization middleware called");
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
            } catch (error) {
                send401Response(res);
                return;
            }
            next();
        }
    }
}