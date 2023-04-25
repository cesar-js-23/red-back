const mongoose = require("mongoose");
const connection = async () => {
  await mongoose
    .connect(
      "mongodb://mongo:ZbKtFklO6wvxOkeK13Ck@containers-us-west-98.railway.app:7654"
    )
    .then(() => console.log("Connected!"));
};
module.exports = connection;
