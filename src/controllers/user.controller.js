import { asyncHandler } from "../utils/asyncHahandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { subscribe } from "diagnostics_channel";
import mongoose from "mongoose";


const generateAccessAndRefreshToken = async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();//this is for generateAccessToken
        const refreshToken = user.generateRefreshToken(); // this is for generateRefreshToken

        user.refreshToken = refreshToken 
        await user.save({validateBeforeSave:false})//mongoose ke model kickin ho jata hai yaha password kick in hoga

        return {accessToken, refreshToken}

    }catch(error){
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    // get user details from frontend
    // validation -not empty
    // check if user already exists :usernae,email
    // check for images , check fo avatar
    // upload them to cloudinary , avatar
    // create user object - create entery in db
    // remove password and refesh token filed from response
    // check for user creation
    // return response if not than error

    const{fullName, email, username, password }=req.body;
    // console.log("email", email);

    // if(fullName === ""){
    //     throw new ApiError(400, "fullname is required")
        
    // }
    // if(email === ""){
    //     throw new ApiError(400,"email is required")
    // }
    // if(username === ""){
    //     throw new ApiError(400, "username is required ")
    // }
    // if(password === "") {
    //     throw new ApiError(400, "Password is required")
    
    // }

    // USING MAP 
    // if(![fullName,email,username,password].every(field => field?.trim() === "")){
    //     throw new ApiError(400,"All fields are required")
    // }

    // USING SOME 
    if([fullName, email, username, password].some(field => field ?.trim()=== "")){
        throw new ApiError(400, "All fields are required");
    }
    
    // existing user check
    const existedUser= await User.findOne({
        $or:[{ username },{ email }]
    })
    if(existedUser){
        throw new ApiError(409, "User with this  email id  or username exist")
    }

    // handle images req.files comes with multer
    const avatarLocalPath=req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    //coverImage[0] it access first property 
    // console.log( "req.files",req.files)
    // console.log("AVATAR PATH:", req.files?.avatar?.[0]?.path);

    

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage =await uploadOnCloudinary(coverImageLocalPath);
    

    if(!avatar?.url){
        throw new ApiError(500,"Avatar uploaded failed")
    }

   const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url|| "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser =await User.findById(user._id).select(
        "-password -refreshToken "
    )
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while register the user")

    }
    return res.status(201).json(
        new ApiResponse(200, createdUser , "User register successfully")
    )
    
})

const loginUser = asyncHandler(async(req,res)=>{
    // take data from req body
    // username or email what you want to login
    // find the user in data base
    // check password is write or wrong 
    // access and refresh token generate 
    // send cookie 

    const {email,username,password}=req.body;

    if(!username || !email){
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or :[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }
// generate accesstoke and refreshtoken
    const {accessToken, refreshToken }  = await generateAccessAndRefreshToken(user._id);

// left from filedd that password and refeshtoken token is not include
    const loggedInUser = await User.findById(user._id).
    select(-password -refreshToken)

// cookies send it can not modified by user update by server

    const options ={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,{
                user:loggedInUser, accessToken , refreshToken

            },
            "User logged in Successfully"
        )
    )


})

const logoutUser = asyncHandler(async (req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },{
            new:true
        }
    )
    const options ={
        httpsOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refrshToken", options)
    .json(new ApiResponse(200,{},"User logged Out"))
    
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken =  req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try{
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken._id)

    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }
    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Invalid refresh token")
    }

    const options = {
        httpOnly:true,
        secure:true
    }

    const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)

    return res
    .status(200)
    .cooke("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(200,
            {accessToken, refreshToken:newRefreshToken},
            "Access token refreshed successfully"
        )
    )


  }catch(error){
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }


})

// password change
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body;
    const user = User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old Password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return response.status(200).json(new ApiResponse(200, {}, "PAssword change successfully"))
})


// get current user
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(200, req.user, "Current user fetched successfully")
})


const updateAccountDetails= asyncHandler(async(req,res)=>{
    const {fullName, email}=req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
    )
    .select("-pasword")

    return res.status(200)
    .json(new ApiResponse(200,user,"Account detailsupdated successfully"))
})


const updateUserAvatar =asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            { $set:{
                avatar:avatar.url
            }
         },
            {new:true}
        ).select("-password")
    
    return res.status(200).json(
        new ApiResponse(200, user,"Avatar updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"CoverImage is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on coverImage")
    }
        const user=await User.findByIdAndUpdate(
            req.user?._id,
            {$set:{
                covetImage:coverImage.url
            }
         },
            {new:true}
        ).select("-password")
        return res
        .status(200)
        .json(
            new ApiResponse(200,user,"Cover Image updated successfully")
        )
    
})

const getUserChannelProfile= asyncHandler(async(req,res)=>{
    const {username}=req.params;

    if(!username?.trim()){
        throw new ApiError(400,"Username is missing")

    }

    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
           }  
        },
        {
            $addFields:{
                subscribersCount:{$size:"$subscribers"},
                channelsSubscribedToCount:{$size:"$subscribedTo"},
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                avatar:1,
                coverImage:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                email:1
            }
        }
        
     ]) 
     if(!channel?.length){
        throw new ApiError(404,"Channel not found")
     }
     return res.
     status(200).
     json(
        new ApiResponse(200, channel[0], " USer channel profile fetched successfully")
     )
})  

const getWatchHistory = asyncHandler(async(req,res)=>{
   const user= await User.aggregate([
    {
        $match:{
            _id:new mongoose.Types.ObjectId(req.user?._id)
        }
    },
    {
        $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id", 
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    fullName:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                    }
                    
                },
                {
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }

            ]
        }
    }
   ])
   return res.status(200).json(
    new ApiResponse(200,
        user?.[0]?.watchHistory ,
        "Watch history fetched succeffully"

    )
   )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory


};