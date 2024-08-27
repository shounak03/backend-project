import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_SECRET_KEY
});

const uploadCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;
        const res = await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'auto',
        })
        console.log("file uploaded on cloudinary",res.url);
        return res
        
    }catch(err){
        fs.unlinkSync(localFilePath)
        console.log(err)
    }
} 

cloudinary.uploader.upload(
    'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
        public_id: 'shoes',
    }
)
.catch((error) => {
    console.log(error);
});

export {uploadCloudinary}