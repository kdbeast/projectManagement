import { Router } from "express";
import {
  userLoginValidation,
  userRegistorValidation,
} from "../validators/index.js";
import {
  loginUser,
  registerUser,
  logoutUser,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";

const router = Router();

router
  .route("/register")
  .post(userRegistorValidation(), validate, registerUser);
router.route("/login").post(userLoginValidation(), validate, loginUser);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
