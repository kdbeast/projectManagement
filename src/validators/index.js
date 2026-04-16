import { body } from "express-validator";
import { AvailableRolesEnum } from "../utils/constants.js";

const userRegistorValidation = () => {
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

const userLoginValidation = () => {
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

const userChangePasswordValidation = () => {
  return [
    body("currentPassword")
      .trim()
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .trim()
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ];
};

const userForgetPasswordValidation = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
  ];
};

const userResetPasswordValidation = () => {
  return [
    body("newPassword")
      .trim()
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ];
};

const createProjectValidation = () => {
  return [
    body("name").trim().notEmpty().withMessage("Project name is required"),
    body("description").trim().optional(),
  ];
};

const addMemberToProjectValidation = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("role")
      .trim()
      .notEmpty()
      .withMessage("Role is required")
      .isIn(AvailableRolesEnum)
      .withMessage("Role is Invalid"),
  ];
};

export {
  userLoginValidation,
  userRegistorValidation,
  createProjectValidation,
  userResetPasswordValidation,
  userForgetPasswordValidation,
  userChangePasswordValidation,
  addMemberToProjectValidation,
};
