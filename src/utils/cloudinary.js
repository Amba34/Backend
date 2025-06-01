import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


// Configure Cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    if(!filePath) {
      throw new Error("File path is required for upload");
      return null;
    }
    const responce = await cloudinary.uploader.upload(filePath,{
        resource_type: "auto",

    })
    // file uploaded
    console.log("File uploaded successfully to Cloudinary",responce.url);
    return responce;


  } catch (err) {
    fs.unlinkSync(filePath); // Delete the file from local storage as uplaod failed
    return null;
  }
}

export { uploadOnCloudinary };