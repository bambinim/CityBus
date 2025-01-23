const {User} = require('../database')


exports.registerNewUser = async (req, res) => {
    try{
        const {firstName, lastName, email, password} = req.body
        const user = new User({
            name: { first: firstName, last: lastName},
            email, password
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