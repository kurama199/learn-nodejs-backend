import { ApiError } from '../utils/apiError';
import { User } from '../models/user.model';
import { asyncHandler } from '../utils/asyncHandler';
import jwt from 'jsonwebtoken';

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header('Authorization')?.replace('Bearer ', '');
    if (!accessToken) {
      throw new ApiError(401, 'User unauthorized');
    }
    const decodedToken = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );
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
