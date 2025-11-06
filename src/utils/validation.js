const validator = require('validator');

const validateSignUp = (req) => {
    // Validation logic here
    const {firstName, lastName, email, password} = req.body;

    if (!firstName || !lastName || !email || !password) {
        throw new Error("Missing required fields");
    }
    
}

const validateEditProfileData = (req) => {
    const allowedEdiFields = [
        firstName,
        lastName,
        age,
        gender,
        skills,
        isAbaRouting,
        photoUrl
    ];

    const isAllowed = Object.keys(req.body).every(field => 
        allowedEdiFields.includes(field)
    );


}

module.exports = {
    validateSignUp,
    validateEditProfileData,
}