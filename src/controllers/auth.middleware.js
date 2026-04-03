import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHahandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,resizeBy,next)=>{
    try{
        const token = req.cookie?.accessToken || req.header
      ("Authorization")?.replace("Bearer" , "")

     if(!token){
        throw new ApiError(401,"Unauthorized request")
     }

     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     await User.findById(decodedToken?._id)
     .select("-password  -refreshToken")

     if(!user){
        // NEXT _VIDEO :DISCUSS ABOUT FRONTEND
        throw new ApiError(401, "Invalid Access Token ")
     }
     req.user = user;
     next()


    }catch(error){
        throw new ApiError(404),erroe?.message || "Invalid access token"

    }
})