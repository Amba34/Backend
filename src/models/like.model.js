
import mongoose ,{Schema} from "mongoose";

import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema({
    video :{
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
},{
    timeseries: true
})

likeSchema.plugin(mongooseAggregatePaginate);
export const Like = mongoose.model("Like", likeSchema);