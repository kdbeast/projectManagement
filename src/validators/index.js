import { body } from "express-validator";

const userRegistorValidation = (req, res, next) => {
  return [
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .toLowerCase()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("fullName").trim().optional(),
  ];
};
const userLoginValidation = (req, res, next) => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ];
};

export { userRegistorValidation, userLoginValidation };
