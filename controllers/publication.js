// Acciones de prueba
const fs = require("fs");
const path = require("path");
const Publication = require("../models/publication");

const followService = require("../services/followService");

const pruebaPublication = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde: controllers/publication",
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

  if (!params.text) {
    return res.status(200).send({
      status: "error",
      message: "Debes enviar un texto",
    });
  }

  let newPublication = new Publication(params);
  newPublication.user = req.user.id;

  newPublication.save((error, publicationStored) => {
    if (error || !publicationStored) {
      return res.status(404).send({
        status: "error",
        message: "No se ha guardado la publicacion",
      });
    }
    return res.status(200).send({
      status: "success",
      message: "Publicacion Guardada",
      publicationStored,
    });
  });
};

const detail = (req, res) => {
  const publicationId = req.params.id;

  Publication.findById(publicationId, (error, publicationStored) => {
    if (error || !publicationStored) {
      return res.status(404).send({
        status: "error",
        message: "No existe la publicación",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Mostrar publicación",
      publication: publicationStored,
    });
  });
};

const remove = (req, res) => {
  const publicationId = req.params.id;
  Publication.find({ user: req.user.id, _id: publicationId }).remove(
    (error) => {
      if (error) {
        return res.status(500).send({
          status: "error",
          message: "No se ha eliminado la publicación",
        });
      }

      return res.status(200).send({
        status: "success",
        message: "Eliminar publicación",
        publication: publicationId,
      });
    }
  );
};

const user = (req, res) => {
  const userId = req.params.id;

  let page = 1;

  if (req.params.page) page = req.params.page;

  const itemsPerPage = 3;

  Publication.find({ user: userId })
    .sort("-created_at")
    .populate("user", "-password -__v -role -email")
    .paginate(page, itemsPerPage, (error, publications, total) => {
      if (error || !publications || publications.length <= 0) {
        return res.status(404).send({
          status: "error",
          message: "No hay publicaciones para mostrar",
        });
      }
      return res.status(200).send({
        status: "success",
        message: "Publicaciones de perfil de un usuarios",
        page,
        total,
        pages: Math.ceil(total / itemsPerPage),
        publications,
      });
    });
};

const upload = (req, res) => {
  const publicationId = req.params.id;
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
  Publication.findOneAndUpdate(
    { user: req.user.id, _id: publicationId },
    { file: req.file.filename },
    { new: true },
    (error, publicationUpdated) => {
      console.log("ga", publicationUpdated);
      if (error || !publicationUpdated) {
        return res.status(500).send({
          status: "error",
          message: "Error en la subida de la publicacion",
        });
      }

      return res.status(200).send({
        status: "success",
        publication: publicationUpdated,
        file: req.file,
      });
    }
  );
};

const media = (req, res) => {
  const file = req.params.file;

  const filePath = "./uploads/publications/" + file;

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

const feed = async (req, res) => {
  let page = req.params.page;

  if (req.params.page) page = req.params.page;

  let itemsPerPage = 3;
  try {
    const myFollows = await followService.followUserIds(req.user.id);

    const publications = Publication.find({
      user: myFollows.following,
    })
      .populate("user", "-password -role -__v -email")
      .sort("-create-at")
      .paginate(page, itemsPerPage, (error, publications, total) => {
        if (error || !publications) {
          return res.status(500).send({
            status: "error",
            message: "No hay publicaciones para mostrar",
          });
        }

        return res.status(200).send({
          status: "success",
          message: "Feed de publicaciones",
          following: myFollows.following,
          total,
          pages: Math.ceil(total / itemsPerPage),
          publications,
        });
      });

    // Publication.find({ user: myFollows.following }).exec(error,publications);
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "No se han listado las publicaciones del feed",
    });
  }
};

module.exports = {
  pruebaPublication,
  save,
  detail,
  remove,
  user,
  upload,
  media,
  feed,
};
