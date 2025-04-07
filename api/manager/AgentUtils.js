const jwt = require('jsonwebtoken');
const config = require('../config');

function generateAgentToken(id) {
    const payload = {
        id: id,
        role: "driver"
    };

    const token = jwt.sign(payload, config.APP_SECRET, {
        expiresIn: "7d"
    });

    return `Bearer ${token}`;
}

module.exports = {
    generateAgentToken
};