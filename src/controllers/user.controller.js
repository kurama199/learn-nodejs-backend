import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const generateAccessOrRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating Refresh and Access Token'
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  // get userDetails from frontend
  // validation for details - not empty
  // check if user already exists: username, email
  // check files - avatar required, coverImage optional
  // upload files to cloudinary - get, get urls
  // create user object - create entry in db
  // remove password and refreshToken field from response
  // check for user creation
  // return res

  const { userName, email, fullName, password } = req.body;
  if (
    [userName, email, fullName, password].some(
      (field) => !field || field?.trim() === ''
    )
  ) {
    throw new ApiError(400, 'Required fields are missing');
  }

  const isExistingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (isExistingUser) {
    throw new ApiError(409, 'userName already exists');
  }
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required');
  }

  // upload to cloudinary
  const avatarCloudinaryObj = await uploadOnCloudinary(avatarLocalPath);
  console.log('avatarCloudinaryObj', avatarCloudinaryObj);
  const coverImageCloudinaryObj = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;
  if (!avatarCloudinaryObj) {
    throw new ApiError(500, 'Error while uploading avatar image');
  }
  const userCreated = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    avatar: avatarCloudinaryObj.url,
    coverImage: coverImageCloudinaryObj?.url || '',
    password,
  });
  const createdUser = await User.findById(userCreated._id).select(
    '-password -refreshToken'
  );
  if (!createdUser) {
    res.json(new ApiError(500, 'Something went wrong while creating user'));
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user: createdUser },
        'user registered successfully'
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // get userName/email and password from frontend
  // find the user in db
  // if found compare password, if password wrong send error
  // if password correct generate accessToken and refreshToken
  // send cookies

  const { userName = '', email = '', password } = req.body;

  if (!userName && !email) {
    throw new ApiError(400, 'userName or email is required');
  }

  const user = await User.findOne({
    $or: [{ userName: userName.toLowerCase() }, { email }],
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid User Credentials');
  }

  const { accessToken, refreshToken } = await generateAccessOrRefreshToken(
    user._id
  );

  const loggedInuser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInuser,
          accessToken,
          refreshToken,
        },
        'User logged in Successfully'
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User Logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const userFromRefreshToken = await User.findById(decodedToken._id);

    if (!userFromRefreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (userFromRefreshToken !== incomingRefreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    const { refreshToken, accessToken } = await generateAccessOrRefreshToken(
      userFromRefreshToken._id
    );

    return res
      .status(200)
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          'Access Token Refreshed'
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh Token');
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
