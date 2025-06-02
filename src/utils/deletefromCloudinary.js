import { v2 as cloudinary } from "cloudinary";

export const deleteFromCloudinary = async (publicId) => {
    if(!publicId) {
        throw new Error("Public ID is required to delete from Cloudinary");
    }
    await cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
            throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
        }
        return result;
    });
}