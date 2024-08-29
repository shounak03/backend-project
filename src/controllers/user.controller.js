import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {apiResponse} from "../utils/apiResponse.js"

const registerUser = asyncHandler(async (req,res)=>{
    
    /*
    steps to register a user
      1. get user details for frontend
      2. validate user details - should not be empty
      3. check if user already exists
      4. hash password
      5. check for images, avatar
      6. upload avatar to cloudinary
      7. create user object - entry in db
      8. remove password and refresh token from field of response
      9. check for user creation
      10. return response
    */

      const {fullname, email, username, password } = req.body //s1

      if( //s2
        [fullname, email, username, password].some((field)=>field?.trim()==="")
      ){
        throw new apiError(400,"All fields are required")
      }

      const existedUser = await User.findOne({
        $or: [{ email },{ username }]
      })
      if(existedUser){ //s3
        throw new apiError(409,"User already exists")
      }

      const avatar_url = req.files?.avatar[0]?.path;
      console.log(avatar_url);
      
      const coverImage_url = req.files?.coverImage[0]?.path;
      console.log(coverImage_url);

      if(!avatar_url)
        throw new apiError(400,"Avatar is required")

      const avatar = await uploadOnCloudinary(avatar_url)
      const coverImage = await uploadOnCloudinary(coverImage_url)

      if(!avatar)
            throw new apiError(400,"Avatar is required")

    const user = await User.create({ //s7
        fullname,
        email,
        username:username.toLowerCase(),
        avatar:avatar.url,
        coverImage:coverImage.url || "",
        password
    })

   const created_user = await User.findById((user._id)).select( //s8
        "-password -refreshToken"
    )

    if(!created_user){ //s9
        throw new apiError(500,"something went wrong while registering user")
    }

    return res.status(201).json( //s10
        new apiResponse(200,created_user,"user registered successfully")
    )

});

const loginUser = asyncHandler(async(req,res)=>{
  /*
  how to login a user
    1. get the user credentials
    2. username or email
    3. check if user exists, find the user
    4. check if the entertered password matches with the stored one
    5. access and refresh token
  */
});

export {registerUser, loginUser}