import mongoose , {Schema}  from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { use } from "react";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,

    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String,
        default: "https://res.cloudinary.com/dzq1xj3qj/image/upload/v1735681234/avatars/avatar.png",
        reqeured: true,

    },

    coverImage: {
        type: String,
        default: "https://res.cloudinary.com/dzq1xj3qj/image/upload/v1735681234/avatars/cover.jpg",
        reqeured: true,
    },

    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video",
    }],

    password: {
        type: String,
        required: [true, "Password is required"],
    },

    refrashToken: {
        type: String,
        default: null,
    },
}, {
    timestamps: true
});

userSchema.pre("save", async function (next)  {
    if(!this.isModified("password")) {
        return next(); // Skip hashing if password is not modified
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    const token = jwt.sign(
        { id: this._id ,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
         process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
    );
    return token;
}
userSchema.methods.generateRefreshToken = function () {
    const token = jwt.sign(
        { id: this._id 
        },
         process.env.REFRESH_TOKEN_SERECT,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d" }
    );
    return token;
}

export const User = mongoose.model("User", userSchema);
