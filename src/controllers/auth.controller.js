import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  emailVerificationMailgenContent,
  forgetPasswordMailgenContent,
  sendMail,
} from "../utils/mail.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "Please fill all the fields");
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({
    email,
    password,
    username,
    isEmailVerified: false,
  });

  // Generate email verification token
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken("emailVerification");

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user?.username,
      `${req.protocol}://${req.get(
        "host",
      )}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgetPasswordToken -forgetPasswordExpiry",
  );

  if (!createdUser) {
    throw new ApiError(500, "Error creating user");
  }

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: createdUser,
      },
      "User registered successfully",
    ),
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please fill all the fields");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "Invalid credentials");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgetPasswordToken -forgetPasswordExpiry",
  );

  if (!loggedInUser) {
    throw new ApiError(500, "Error logging in user");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: null },
    },
    { new: true },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  let hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired token");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isEmailVerified: true },
        "Email verified successfully",
      ),
    );
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  // Generate email verification token
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken("emailVerification");

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user?.username,
      `${req.protocol}://${req.get(
        "host",
      )}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Verification email resent successfully. Please check your inbox.",
      ),
    );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenFromCookie =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshTokenFromCookie) {
    throw new ApiError(401, "Refresh token not found, please login again");
  }

  const user = await User.findOne({ refreshToken: refreshTokenFromCookie });
  if (!user) {
    throw new ApiError(401, "Invalid refresh token, please login again");
  }

  try {
    const decodedToken = jwt.verify(
      refreshTokenFromCookie,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (user?.refreshToken !== refreshTokenFromCookie) {
      throw new ApiError(401, "Refresh token is expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token, please login again");
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken("forgetPassword");

  user.forgetPasswordToken = hashedToken;
  user.forgetPasswordExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Password Reset Request",
    mailgenContent: forgetPasswordMailgenContent(
      user?.username,
      `${process.env.FORGET_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset email sent successfully. Please check your inbox.",
      ),
    );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }
  if (!newPassword) {
    throw new ApiError(400, "New password is required");
  }

  let hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgetPasswordToken: hashedToken,
    forgetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired token");
  }

  user.password = newPassword;
  user.forgetPasswordToken = undefined;
  user.forgetPasswordExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset successfully. You can now login with your new password.",
      ),
    );
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Please fill all the fields");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});
