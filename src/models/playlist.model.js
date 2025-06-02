
import mongoose ,{Schema} from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema({
    title:{
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
    videos: [{
        type: Schema.Types.ObjectId,
        ref: "Video", // Reference to the Video model
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
    },
})

playlistSchema.plugin(mongooseAggregatePaginate);
export const Playlist = mongoose.model("Playlist", playlistSchema);