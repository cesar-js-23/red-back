// Acciones de prueba
const follow = require("../models/follow");
const Follow = require("../models/follow");
const User = require("../models/users");

const followService = require("../services/followService");

const mongoosePagination = require("mongoose-pagination");

const pruebaFollow = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/follow",
  });
};

// const save = (req,res) => {
//   return res.status(200).send({
//     status : "success",
//     message: "Metodo dar follow"
//   })
// };

const save = (req, res) => {
  const params = req.body;
  const identity = req.user;

  let userToFollow = new Follow({
    user: identity.id,
    followed: params.followed,
  });

  userToFollow.save((error, followStored) => {
    if (error || !followStored) {
      return res.status(500).send({
        status: "error",
        message: "No se ha podido seguir al usuario",
      });
    }
    return res.status(200).send({
      status: "success",
      identity: identity,
      follow: followStored,
    });
  });
};

const unfollow = (req, res) => {
  const userId = req.user.id;

  const followId = req.params.id;
  Follow.find({
    user: userId,
    followed: followId,
  }).remove((error, followDeleted) => {
    if (error || !followDeleted) {
      return res.status(500).send({
        status: "error",
        message: "No has dejado de seguir a nadie",
      });
    }
    return res.status(200).send({
      status: "success",
      message: "Follow eliminado correctamente",
      identity: req.user,
      followDeleted,
    });
  });
};
const following = (req, res) => {
  // Sacar el id del usuario identificado
  let userId = req.user.id;

  // Comprobar si me llega el id por paramatro en url
  if (req.params.id) userId = req.params.id;

  // Comprobar si me llega la pagina, si no la pagina 1
  let page = 1;

  if (req.params.page) page = req.params.page;

  // Usuarios por pagina quiero mostrar
  const itemsPerPage = 3;

  // Find a follow, popular datos de los usuario y paginar con mongoose paginate
  Follow.find({ user: userId })
    .populate("user followed", "-password -role -__v -email")
    .paginate(page, itemsPerPage, async (error, follows, total) => {
      // Listado de usuarios de trinity, y soy victor
      // Sacar un array de ids de los usuarios que me siguen y los que sigo como victor
      let followUserIds = await followService.followUserIds(req.user.id);

      return res.status(200).send({
        status: "success",
        message: "Listado de usuarios que estoy siguiendo",
        follows,
        total,
        pages: Math.ceil(total / itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followUserIds.followers,
      });
    });
};

// const following = (req, res) => {
//   let userId = req.user.id;

//   if (req.params.id) userId = req.params.id;

//   let page = 1;

//   if (req.params.page) page = req.params.page;

//   const itemsPerPage = 3;

//   //mongoosePagination

//   Follow.find({ user: userId })
//     .populate("user followed", "-password -role -__v -email")
//     .paginate(page, itemsPerPage, async (error, follows, total) => {
//       let followUserIds = await followService.followUserIds(req.user.id);

//       return res.status(200).send({
//         status: "success",
//         message: "Listado de usuarios que estoy siguiendo",
//         follows,
//         total,
//         pages: Math.ceil(total / itemsPerPage),
//         user_following: followUserIds.following,
//         user_follow_me: followUserIds.followers,
//       });
//     });
// };

const followed = (req, res) => {
  let userId = req.user.id;

  if (req.params.id) userId = req.params.id;

  let page = 1;

  if (req.params.page) page = req.params.page;

  const itemsPerPage = 3;

  Follow.find({ followed: userId })
    .populate("user", "-password -role -__v -email")
    .paginate(page, itemsPerPage, async (error, follows, total) => {
      let followUserIds = await followService.followUserIds(req.user.id);

      return res.status(200).send({
        status: "success",
        message: "Listado de usuarios que me siguen",
        follows,
        total,
        pages: Math.ceil(total / itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followUserIds.followers,
      });
    });
};

module.exports = {
  pruebaFollow,
  save,
  unfollow,
  following,
  followed,
};
