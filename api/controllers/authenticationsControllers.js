const { APP_SECRET} = require('../config')
const {User} = require('../database')
const {RenewToken} = require('../database')
const jwt = require('jsonwebtoken')
const { Logger } = require("../logging");
const config = require('../config');
const {verifyPassword, hashPassword} = require("../middleware/security");


exports.authenticateUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        Logger.error("Login failed: Missing email or password");
        res.status(401).send({message: "Login failed: Missing email or password"});
        return;
    }

    try {
        const user = await User.findOne({ email});
        if (!user) {
            Logger.error("Login failed: User not found");
            res.status(401).send({message: "Login failed: User not found"});
            return;
        }

        const isPasswordCorrect = await verifyPassword(password, user.password);

        if(!isPasswordCorrect) {
            Logger.error("Login failed: Password not correct");
            res.status(401).send({message: "Login failed: Password not correct"});
            return;
        }

        const jwtToken = jwt.sign(
            { userId: user._id, role: user.role },
            config.APP_SECRET,
            { expiresIn: '1d' }
        );

        const renewToken = jwt.sign(
            { userId: user._id },
            config.APP_SECRET,
            { expiresIn: '7d' }
        );

        const newRenewToken = new RenewToken({
            token: renewToken,
            userId: user._id
        });

        await newRenewToken.save();

        Logger.info("User logged in successfully");
        res.status(201).json({ jwt: jwtToken, renewToken });
    } catch (error) {
        Logger.error("Login failed: " + error.message);
        res.status(500).send({message: "Internal server error"});
    }
};

exports.renewSession = async (req, res) => {
    const { renewToken } = req.body;

    try {
        const decoded = jwt.verify(renewToken, config.APP_SECRET);
        const renewTokenEntry = await RenewToken.findOne({ token: renewToken });

        if (!renewTokenEntry) {
            Logger.error("Unauthorized: Invalid renew token");
            return res.status(401).send({ message: "Unauthorized: Invalid renew token" });
        }

        // Trova l'utente corrispondente al token
        const user = await User.findById(decoded.userId);
        if (!user) {
            Logger.error("Unauthorized: User not found");
            return res.status(401).send({ message: "Unauthorized: User not found" });
        }


        const newJwtToken = jwt.sign(
            { userId: user._id, role: user.role },
            config.APP_SECRET,
            { expiresIn: '1d' }
        );

        const newRenewToken = jwt.sign(
            { userId: user._id },
            config.APP_SECRET,
            { expiresIn: '7d' }
        );

        renewTokenEntry.token = newRenewToken;
        await renewTokenEntry.save();

        Logger.info("Session renewed successfully");
        res.status(200).json({ jwt: newJwtToken, renewToken: newRenewToken });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).send({ message: "Unauthorized: Invalid token" });
        } else {
            console.error('Error renewing session:', error);
            res.status(500).send({ message: "Internal Server Error" });
        }
    }
};

exports.deleteSession = async (req, res) => {
     if (!req.userId) {
        return res.status(401).send({ message: "User not authenticated" });
    }
    try {
        await RenewToken.deleteOne({ userId: req.userId });
        res.status(200).send("Session deleted");
    } catch (error) {
        res.status(500).send({ message: "Internal Server Error" });
    }
}