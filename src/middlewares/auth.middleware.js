// import { User } from "../models/user.model.js";
// import { apiError } from "../utils/apiError.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import jwt from "jsonwebtoken";

// export const verifyJWT = asyncHandler(async (req, _, next) => {
//     try {
//         const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
//         console.log(jwt.verify(token,process.env.ACCESS_TOKEN_SECRET));
        
//         if (!token) {
//             throw new apiError(401,"Unauthorized request")
//         }
    
//         const decoded_token = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
//         const user = await User.findById(decoded_token?._id).select("-password -refreshToken")
//         if(!user){
//             throw new apiError(401,"invalid access token")
//         }
//         req.user = user;
//         next()
//     } catch (error) {
//         throw new apiError(401,"invalid access token")
//     }
// })

import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        console.log("Cookies:", req.cookies);
        console.log("Authorization header:", req.header("Authorization"));

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log("Extracted token:", token);

        if (!token) {
            throw new apiError(401, "Unauthorized request");
        }

        console.log("Verifying token...");
        const decoded_token = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Decoded token:", decoded_token);

        const user = await User.findById(decoded_token?._id).select("-password -refreshToken");
        if (!user) {
            throw new apiError(401, "Invalid access token");
        }

        console.log("User found:", user._id);
        req.user = user;
        next();
    } catch (error) {
        console.error("Error in verifyJWT:", error);
        throw new apiError(401, "Invalid access token");
    }
});