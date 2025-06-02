import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponce.js";
import jwt from "jsonwebtoken";

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


export { registerUser, loginUser, logoutUser,refrashAccessToken }
