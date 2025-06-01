import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate  from "mongoose-aggregate-paginate-v2";



const videoSchema = new Schema({
    videoFile: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    duration: {
        type: Number,
        required: true,
        min: 0, // Duration should be a positive number
    },
    category: {
        type: String,
        required: true,
        enum: ["Music", "Gaming", "Education", "Entertainment", "News", "Sports", "Technology", "Lifestyle"],
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublic: {
        type: Boolean,
        default: true, // Videos are public by default
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
    },
}, {
    timestamps: true
});

videoSchema.plugin(mongooseAggregatePaginate);
// Adding a method to the schema to increment views

export const Video = mongoose.model("Video", videoSchema);