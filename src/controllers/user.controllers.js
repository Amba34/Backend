import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponce.js";
import jwt from "jsonwebtoken";
import { deleteFromCloudinary } from "../utils/deletefromCloudinary.js";

const registerUser = asyncHandler( async (req,res) =>{
    // get user data from request body   
    // if([username, email, password].some(field => !field)) {}
    // validate user data
    // check if user already exists : username or email
    // check for images , check for avatar
    // upload images to cloudinary : avatar
    // creat user object - create entry in database
    // remove password and refresh token from user object
    // check if user is created successfully
    // return success response with user data
    const { username, email, password,fullName } = req.body;

    if(!username || !email || !password || !fullName) {
        throw new ApiError(400, "Username, email and password are required");
    }

    const existedUser = await User.findOne({
        $or : [
            { username: username },
            { email: email }
        ]
    })
    if(existedUser) {
        throw new ApiError(409, "Username or email already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;
    if( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar and cover image are required");
    }
let coverImage;
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(coverImageLocalPath) {
        coverImage =  await uploadOnCloudinary(coverImageLocalPath)
    }

    if(!avatar ) {
        throw new ApiError(500, "Failed to upload images to cloudinary");
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),

    })

    const createdUser = await User.findById(user._id).select("-password -refrashToken")

    if(!createdUser) {
        throw new ApiError(500, "Failed to create user");
    }

    return res.status(201).json(
        new ApiResponse(createdUser, "User created successfully")
    )

} )

const generateAccessTokenAndRefreshToken = async (u) => {
    try{
        const user = await User.findById(u._id)
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refrashToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    }catch(error) {
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "Internal server error");
    }
}  


const loginUser = asyncHandler( async (req, res) => {
    // Implement login logic here
    // get data from request body
    // validate data // username or email and password are provided
    // check if user exists
    // check password
    // generate token
    // send cookie with token
    // return success response with user data and token
    console.log("Login request received:", req.body);
    const { username, password , email } = req.body;
    if(!(username || email)){
        throw new ApiError(400, "Username or email is required");
    }
    if(!password) {
        throw new ApiError(400, "Password is required");
    }
    const user = await User.findOne({
        $or : [
            { username: username?.toLowerCase() },
            { email: email?.toLowerCase() }
        ]
    })
    if(!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)
    if(!isPasswordvalid) {
        throw new ApiError(401, "Invalid password");
    }
    const  {refreshToken , accessToken } = await generateAccessTokenAndRefreshToken(user)

    const logggedInUser = await User.findById(user._id).select("-password -refrashToken")


    const options = {
        httpOnly: true,
        secure: true // Set to true in production
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(true, 
            "User logged in successfully",
            {
                user : logggedInUser,accessToken,refreshToken
            }
            , logggedInUser)
        
    )
    }

)


const logoutUser = asyncHandler( async (req, res) => {
    
    User.findByIdAndUpdate(req.user._id, 
        {
            $set: { refrashToken: null }
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true // Set to true in production
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(true,{} ,"User logged out successfully",200)
    )
})

const refrashAccessToken = asyncHandler( async (req, res) => {
    // get refresh token from cookies
    // validate refresh token
    // generate new access token and refresh token
    // send cookies with new tokens


    const incommingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if(!incommingRefreshToken) {
        throw new ApiError(401, "unauthorized request, refresh token is required");

    }
    const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SERECT)
    try {
        if(!decodedToken?._id) {
            throw new ApiError(401, "Invalid refresh token");
        }
    
        const user = await User.findById(decodedToken._id)
        if(!user) {
            throw new ApiError(404, "invalid refresh token, user not found");
        }
        if(user.refrashToken !== incommingRefreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }
    
        const { refreshToken , accessToken} = await generateAccessTokenAndRefreshToken(user);
    
        const options = {
            httpOnly: true,
            secure: true // Set to true in production
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,true, "Access token refreshed successfully", {
                accessToken,
                refreshToken
            }, user)
        )
    } catch (error) {
        console.error("Error refreshing access token:", error);
        throw new ApiError(500, "Internal server error");
        
    }



}
)

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password");
    }

    if(!newPassword) {
        throw new ApiError(400, "New password is required");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res.status(200).json(
        new ApiResponse(200 ,true, "Password changed successfully", {}, user)
    )

})

const getcurrentUser = asyncHandler( async (req, res) => {
 return res
 .status(200)
 .json(
     new ApiResponse(200, true, "Current user fetched successfully", req.user)
 )
})

const updateAccount = asyncHandler( async (req, res) => {
    const { fullName, username, email } = req.body;

    if (!fullName || !username || !email) {
        throw new ApiError(400, "Full name, username and email are required");
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                fullName : fullName.toLowerCase,
                email : email.toLowerCase(),
                username : username.toLowerCase()
            }
        },
        {new: true}
    ).select("-password -refrashToken")
    ;  

    return res
    .status(200)
    .json(
        new ApiResponse(200, true, "Account updated successfully", user)
    )
})

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar  = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar to cloudinary");
    }

    if(req.user?.avatar) {
        await deleteFromCloudinary(req.user.avatar);
    }


    findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },{
            new: true,
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, true, "Avatar updated successfully", {
            avatar: avatar.url
        })
    )
})
const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "coverImage is required");
    }

    const coverImage  = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage) {
        throw new ApiError(500, "Failed to upload coverImage to cloudinary");
    }
        if(req.user?.coverImage) {
        await deleteFromCloudinary(req.user.coverImage);
    }



    findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },{
            new: true,
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, true, "coverImage updated successfully", {
            avatar: avatar.url
        })
    )
})

const getUserChannalProfile = asyncHandler( async (req, res) => {
    const {username} = req.params;
    if(!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        {
            $match : {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                form : "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                form : "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribeTo"
            }
        },
        {
            $addFields:{
                subscribersCount: { $size: "$subscribers" },
                channelSubscribedToCount: { $size: "$subscribeTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribeTo.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, true, "Channel profile fetched successfully", channel[0])
    )
})

 
const getWatchHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new monngoose.Types.ObjectId(req.user._id)
            },
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            form: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                $project : {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner :{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            },

        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, true, "Watch history fetched successfully", user[0]?.watchHistory || [])
    )
})



export { registerUser,
    loginUser,
    logoutUser,
    refrashAccessToken ,
    changeCurrentPassword, 
    getcurrentUser , 
    updateAccount , 
    updateUserAvatar ,
    updateUserCoverImage ,
    getUserChannalProfile,
getWatchHistory };
