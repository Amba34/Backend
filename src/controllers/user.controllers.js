import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponce.js";


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
    console.log("User Data: ", username, email, password, avatar);
    if(!username || !email || !password || !fullName) {
        throw new ApiError(400, "Username, email and password are required");
    }

    const existedUser = User.findOne({
        $or : [
            { username: username },
            { email: email }
        ]
    })
    if(existedUser) {
        throw new ApiError(409, "Username or email already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar and cover image are required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage =  await uploadOnCloudinary(coverImageLocalPath)

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



export { registerUser }