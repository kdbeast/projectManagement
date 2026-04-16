import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ProjectMember from "../models/projectMembers.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgetPasswordToken -forgetPasswordExpiry",
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    req.user = user;
  } catch (err) {
    throw new ApiError(401, "Invalid access token");
  }

  next();
});

export const validateProjectPermission = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user._id;

    if (!projectId) {
      throw new ApiError(400, "Project ID is required");
    }

    const project = await ProjectMember.findOne({
      user: new mongoose.Types.ObjectId(req.user._id),
      project: new mongoose.Types.ObjectId(projectId),
    });

    if (!project) {
      throw new ApiError(403, "Project not found");
    }

    const givenRoles = project.role;
    req.user.role = givenRoles;

    if (!roles.includes(givenRoles)) {
      throw new ApiError(403, "Access denied");
    }

    next();
  });
};
