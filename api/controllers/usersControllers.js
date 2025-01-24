const {User} = require('../database')
const {hashPassword, verifyPassword} = require("../middleware/security");

exports.registerNewUser = async (req, res) => {
    try{
        const {firstName, lastName, email, password, role} = req.body
        hash = await hashPassword(password)
        const user = new User({
            name: { first: firstName, last: lastName},
            email, 
            password: hash,
            role
        });
        await user.save()
        res.status(201).send("User created successfully")
    }catch (error) {
        if (error.code === 11000) {
            return res.status(400).send('Email already exists')
        }
        res.status(500).send('Internal Server Error')
    }
}

exports.getUserInformation = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password -_id');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.changeUserInformation = async (req, res) => {
    const { firstName, lastName } = req.body;
    try {
      const user = await User.findById(req.userId);
      user.name = {
        first: firstName,
        last: lastName
      }
      await user.save();
      res.json({ message: 'User updated' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
};

exports.updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
      const user = await User.findById(req.userId);
      if (verifyPassword(oldPassword, user.password)) {
        user.password = await hashPassword(newPassword);
        await user.save();
        res.json({ message: 'Password updated' });
      } else {
        res.status(403).json({ message: 'Old password does not match' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
};