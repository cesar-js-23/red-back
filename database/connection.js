// const mongoose = require("mongoose");
// const url = "mongodb://localhost:27017/mi_red";
// const connection = async () => {
//   try {
//     await mongoose.connect(url);
//     console.log("Conectado corretamente mi bd : mi_red");
//   } catch (error) {
//     throw new Error("No se ha podido conectar a la base de datos !!");
//   }
// };

// module.exports = connection;

const mongoose = require("mongoose");
const connection = async () => {
  await mongoose
    .connect("mongodb://127.0.0.1:27017/mi_redsocial")
    .then(() => console.log("Connected!"));
};
module.exports = connection;

// mongoose.connect(url, (err) => {
//   if (err) {
//     console.log("1");
//   } else {
//     console.log("2");
//   }
// });

// const mongoose = require("mongoose");
// const BD_URI = "mongodb://localhost:27017/mi_redsocial";
// module.exports = () => {
//   const connect = () => {
//     mongoose.connect(
//       BD_URI,
//       {
//         keepAlive: true,
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       },
//       (err) => {
//         if (err) {
//           console.log("DB: ERROR");
//         } else {
//           console.log("Conexion correcta");
//         }
//       }
//     );
//   };
//   connect();
// };
