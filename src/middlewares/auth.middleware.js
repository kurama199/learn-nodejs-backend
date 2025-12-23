import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');
    if (!accessToken) {
      throw new ApiError(401, 'User is not logged in');
    }
    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    console.log('decoded token is ', JSON.stringify(decodedToken));
    const userFromAccessToken = await User.findById(decodedToken._id).select(
      '-password -refreshToken'
    );

    if (!userFromAccessToken) {
      throw new ApiError(401, 'invalid access token');
    }

    req.user = userFromAccessToken;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || 'invalid Access token');
  }
});
