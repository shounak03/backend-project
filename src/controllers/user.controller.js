import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {apiResponse} from "../utils/apiResponse.js"
import { jwt } from "jsonwebtoken";
const generateAccessAndRefreshToken = async(userId)=>{
  try{
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({validateBeforeSave: false})

      return {accessToken, refreshToken}

  }catch(err){
    throw new apiError(500,"something went wrong")
  }
}

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

/*
how to login a user
1. get the user credentials
2. username or email
3. check if user exists, find the user
4. check if the entertered password matches with the stored one
5. access and refresh token
6. send cookies
7. response - logged in successfully
*/
const loginUser = asyncHandler(async(req,res)=>{

    const {email, username, password } = req.body

    if(!(username || email)) 
      throw new apiError(400, "username or password is required")

    const user = await User.findOne({
      $or :[{email},{username}]
    })

    if(!user)
      throw new apiError(404,"user does not exist")

    const passwordValid = await user.isPasswordCorrect(password)

    if(!passwordValid)
      throw new apiError(401,"incorrect password")

    const {accessToken, refreshToken} = await  generateAccessAndRefreshToken(user._id)
    // console.log(accessToken);
    

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
      httpOnly:true,
      secure:true
    }
    return res.status(200)
              .cookie("accessToken",accessToken,options)
              .cookie("refreshToken", refreshToken, options)
              .json(new apiResponse(200, {user:loggedInUser,refreshToken, accessToken},
                "user logged in successfully"
              ))
});

const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {refreshToken: undefined}
    }
  )
  const options = {
    httpOnly:true,
    secure:true
  }
  res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new apiResponse(
    200,{},"User logged out"
  ))
})

const refreshAccessToken  = asyncHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken)
      throw new apiError(401,"unauthorised request")

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user)
      throw new apiError(401,"invalid refresh token")
  
    if(incomingRefreshToken !== user.refreshToken){
      throw new apiError(401,"refresh token expired")
    }
  
    const options = {httpOnly:true, secure:true}
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken", newRefreshToken,options)
    .json(
      new apiResponse(
        200,{accessToken,refreshToken:newRefreshToken},"token refreshed"
      )
    )
  } catch (error) {
    throw new apiError(401,err?.message || "Invalid token request")
  }

})

export {registerUser, loginUser, logoutUser, refreshAccessToken}