const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect(
        "mongodb+srv://devConnect_admin:xnRppArzgNj5nXaF@clustertest.bbktbbw.mongodb.net/devTinder",
    );
};

module.exports = connectDB;