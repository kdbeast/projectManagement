import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/api-error";

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
