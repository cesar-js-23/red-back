const express = require("express");
const router = express.Router();
const multer = require("multer");
const UserController = require("../controllers/users");
const check = require("../middlewares/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/avatars/");
  },
  filename: (req, file, cb) => {
    cb(null, "avatar-" + Date.now() + "-" + file.originalname);
  },
});

const uploads = multer({ storage });

router.get("/prueba-usuario", check.auth, UserController.pruebaUser);
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/profile/:id", check.auth, UserController.profile);
router.get("/lista/:page", check.auth, UserController.list);
router.put("/update", check.auth, UserController.update);
router.get("/avatar/:file", UserController.avatar);
router.post(
  "/upload",
  [check.auth, uploads.single("file0")],
  UserController.upload
);
router.get("/counters/:id", check.auth, UserController.counters);

module.exports = router;
