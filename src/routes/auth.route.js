import { Router } from "express";
import {
  userLoginValidation,
  userRegistorValidation,
  userResetPasswordValidation,
  userForgetPasswordValidation,
} from "../validators/index.js";
import {
  loginUser,
  logoutUser,
  verifyEmail,
  registerUser,
  refreshToken,
  resetPassword,
  getCurrentUser,
  forgotPassword,
  changeCurrentPassword,
  resendVerificationEmail,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";

const router = Router();

// unsecured routes
router
  .route("/register")
  .post(userRegistorValidation(), validate, registerUser);
router.route("/login").post(userLoginValidation(), validate, loginUser);
router.route("/verify-email/:token").get(verifyEmail);
router.route("/refresh-token").get(refreshToken);
router
  .route("/forget-password")
  .post(userForgetPasswordValidation(), validate, forgotPassword);
router
  .route("/reset-password/:token")
  .post(userResetPasswordValidation(), validate, resetPassword);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(
    verifyJWT,
    userResetPasswordValidation(),
    validate,
    changeCurrentPassword,
  );
router
  .route("/resend-email-verification")
  .get(verifyJWT, resendVerificationEmail);

export default router;
