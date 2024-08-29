import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

        
        if (!token) {
            throw new apiError(401,"Unauthorized request")
        }
    
        const decoded_token = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decoded_token?._id).select("-password -refreshToken")
        if(!user){
            throw new apiError(401,"invalid access token")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new apiError(401,"invalid access token")
    }
})

