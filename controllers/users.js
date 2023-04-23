const bcrypt = require("bcrypt");
const User = require("../models/users");
const Follow = require("../models/follow");
const Publications = require("../models/publication");

const jwt = require("../services/jwt");
const mongoosePagination = require("mongoose-pagination");
const fs = require("fs");
const path = require("path");

const followService = require("../services/followService");

// Acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/user",
    usuario: req.user,
  });
};

const register = (req, res) => {
  let params = req.body;

  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).json({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }

  User.find({
    $or: [
      {
        email: params.email.toLowerCase(),
      },
      {
        nick: params.nick.toLowerCase(),
      },
    ],
  }).exec(async (err, users) => {
    if (err) {
      return res.status(500).json({
        status: "error",
        message: "Error en la consulta de usuarios",
      });
    }
    if (users && users.length >= 1) {
      return res.status(200).send({
        status: "successs",
        message: "El usuario ya existe",
      });
    }

    let pwd = await bcrypt.hash(params.password, 10);
    params.password = pwd;

    let user_to_save = new User(params);

    user_to_save.save((error, userStored) => {
      if (error || !userStored) {
        return res.status(500).send({
          status: "successs",
          message: "Error al guardar",
        });
      }
      return res.status(200).json({
        status: "success",
        message: "Usuario registrado correctamente",
        user: user_to_save,
      });
    });
  });
};

const login = (req, res) => {
  let params = req.body;
  if (!params.email || !params.password) {
    return res.status(400).send({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }
  User.findOne({ email: params.email }).exec((error, user) => {
    console.log("user", user);
    if (error || !user) {
      return res.status(400).send({
        status: "error",
        message: "No existe el usuario",
      });
    }
    console.log("ga", params.password, user.password);
    let pwd = bcrypt.compareSync(params.password, user.password);

    if (!pwd) {
      return res.status(400).send({
        status: "error",
        message: "No te has identificado correctamente",
      });
    }

    const token = jwt.createToken(user);

    res.status(200).json({
      status: "success",
      message: "Acción de login",
      user: {
        id: user._id,
        name: user.name,
        nick: user.nick,
      },
      token,
    });
  });
};

const profile = (req, res) => {
  const id = req.params.id;
  User.findById(id)
    .select({ password: 0, role: 0 })
    .exec(async (error, userProfile) => {
      if (error || !userProfile) {
        return res.status(404).json({
          status: "success",
          message: "El usuario no existe o hay un error",
        });
      }

      const followInfo = await followService.followThisUser(req.user.id, id);

      return res.status(200).send({
        status: "success",
        user: userProfile,
        following: followInfo.following,
        follower: followInfo.followers,
      });
    });
};

const list = (req, res) => {
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }
  page = parseInt(page);

  let itemsPerPage = 3;

  User.find()
    .select("-password -email -role -__v")
    .sort("_id")
    .paginate(page, itemsPerPage, async (error, users, total) => {
      if (error || !users) {
        return res.status(404).send({
          status: "error",
          message: "No hay usuarios diponibles",
        });
      }

      let followUserIds = await followService.followUserIds(req.user.id);

      return res.status(200).send({
        status: "success",
        users,
        page,
        itemsPerPage,
        total,
        pages: Math.ceil(total / itemsPerPage),
        user_following: followUserIds.following,
        user_follow_me: followUserIds.followers,
      });
    });
};

const update = (req, res) => {
  // Recoger info del usuario a actualizar
  let userIdentity = req.user;
  let userToUpdate = req.body;

  // Eliminar campos sobrantes
  delete userToUpdate.iat;
  delete userToUpdate.exp;
  delete userToUpdate.role;
  delete userToUpdate.image;

  // Comprobar si el usuario ya existe
  User.find({
    $or: [
      { email: userToUpdate.email.toLowerCase() },
      { nick: userToUpdate.nick.toLowerCase() },
    ],
  }).exec(async (error, users) => {
    if (error)
      return res
        .status(500)
        .json({ status: "error", message: "Error en la consulta de usuarios" });

    let userIsset = false;
    users.forEach((user) => {
      if (user && user._id != userIdentity.id) userIsset = true;
    });

    if (userIsset) {
      return res.status(200).send({
        status: "success",
        message: "El usuario ya existe",
      });
    }

    // Cifrar la contraseña
    if (userToUpdate.password) {
      let pwd = await bcrypt.hash(userToUpdate.password, 10);
      userToUpdate.password = pwd;

      //añadido
    } else {
      delete userToUpdate.password;
    }

    // Buscar y actualizar
    try {
      let userUpdated = await User.findByIdAndUpdate(
        { _id: userIdentity.id },
        userToUpdate,
        { new: true }
      );

      if (!userUpdated) {
        return res
          .status(400)
          .json({ status: "error", message: "Error al actualizar" });
      }

      // Devolver respuesta
      return res.status(200).send({
        status: "success",
        message: "Metodo de actualizar usuario",
        user: userUpdated,
      });
    } catch (error) {
      return res.status(500).send({
        status: "error",
        message: "Error al actualizar",
      });
    }
  });
};

const upload = (req, res) => {
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "La petición no incluye la imagen",
    });
  }

  let image = req.file.originalname;

  let imageSplit = image.split(".");
  let extension = imageSplit[1];
  if (
    extension != "png" &&
    extension != "jpg" &&
    extension != "jpeg" &&
    extension != "gif"
  ) {
    const filePath = req.file.path;
    const fileDeleted = fs.unlinkSync(filePath);
    return res.status(400).send({
      status: "error",
      message: "Extensión del fichero invalida",
    });
  }
  User.findOneAndUpdate(
    { _id: req.user.id },
    { image: req.file.filename },
    { new: true },
    (error, userUpdated) => {
      console.log("gaa", req.user.id, userUpdated);
      if (error || !userUpdated) {
        return res.status(500).send({
          status: "error",
          message: "Error en la subida del avatar",
        });
      }

      return res.status(200).send({
        status: "success",
        user: userUpdated,
        file: req.file,
      });
    }
  );
  // User.findByIdAndUpdate(
  //   req.user.id,
  //   { image: req.file.filename },
  //   { new: true },
  //   (error, userUpdated) => {
  //     if (error || !userUpdated) {
  //       return res.status(500).send({
  //         status: "error",
  //         message: "Error en la subida del avatar",
  //       });
  //     }

  //     return res.status(200).send({
  //       status: "success",
  //       user: userUpdated,
  //       file: req.file,
  //     });
  //   }
  // );
};

const avatar = (req, res) => {
  const file = req.params.file;

  const filePath = "./uploads/avatars/" + file;

  fs.stat(filePath, (error, exist) => {
    if (!exist) {
      return res.status(404).send({
        status: "error",
        message: "No existe la imagen",
      });
    }
    return res.sendFile(path.resolve(filePath));
  });
};

const counters = async (req, res) => {
  let userId = req.user.id;

  if (req.params.id) {
    userId = req.params.id;
  }

  try {
    const following = await Follow.count({ user: userId });
    const followed = await Follow.count({ followed: userId });
    const publications = await Publications.count({ user: userId });

    return res.status(200).send({
      userId,
      following,
      followed,
      publications,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al counter",
    });
  }
};
module.exports = {
  pruebaUser,
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
  counters,
};
