const {User} = require('../database')
const {hashPassword, verifyPassword} = require("../middleware/security");

exports.registerNewUser = async (req, res) => {
    try{
        const {firstName, lastName, email, password} = req.body

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).send({message: 'Request not valid'})
        }

        const existingUser = await User.find({ email });
        if (existingUser.length > 0) {
            return res.status(400).send({message: 'User already exists'})
        }

        hash = await hashPassword(password)
        const user = new User({
            name: { first: firstName, last: lastName},
            email, 
            password: hash,
        });
        await user.save()
        res.status(201).send()
    }catch (error) {
        if (error.code === 11000) {
            return res.status(400).send({message: 'Request not valid'})
        }
        res.status(500).send({message: 'Internal Server Error'})
    }
}

exports.getUserInformation = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password -_id -__v');
        console.log(user);
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.changeUserInformation = async (req, res) => {
    const { firstName, lastName } = req.body;

    if (!firstName && !lastName) {
      return res.status(400).send({ message: 'Data Missing' });
    }

    try {
      const user = await User.findById(req.userId);
      user.name = {
        first: firstName ? firstName : user.name.first,
        last: lastName ? lastName : user.name.last
      }
      await user.save();
      res.status(200).send();
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Server error' });
    }
};

exports.updatePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old and new passwords are required' });
      }

      const isValidPassword = await verifyPassword(oldPassword, user.password);

      if (isValidPassword) {
        user.password = await hashPassword(newPassword);
        await user.save();
        res.status(200).send();
      } else {
        res.status(403).json({ message: 'Old password does not match' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
};