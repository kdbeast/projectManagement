import { Router } from "express";
import {
  userLoginValidation,
  userRegistorValidation,
} from "../validators/index.js";
import { validate } from "../middlewares/validator.middleware.js";
import { loginUser, registerUser } from "../controllers/auth.controller.js";

const router = Router();

router
  .route("/register")
  .post(userRegistorValidation(), validate, registerUser);
router.route("/login").post(userLoginValidation(), validate, loginUser);

export default router;
