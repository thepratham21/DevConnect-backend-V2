const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userAuth = async (req,res,next) => {
    try{
        //read token from request cookies
    const cookies = req.cookies;
    const {token} = cookies;

    if(!token){
        return res.status(401).send("Please Login !");
    }

    const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

    const {_id} = decodedObj;

    //find user by id
    const user = await User.findById(_id);
    
    if(!user){
        return new Error("User not found");
    }

    req.user = user;

    next();
    }
    catch(err){
        
        res.status(400).send('Error :' + err.message);
    }

}    

    

module.exports = {
    userAuth,
}