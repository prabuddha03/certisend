const s3 = require("../config/s3.config");
const sharp = require("sharp");

const uploadToS3 = async (file, path) => {
  try {
    // Optimize image before upload
    const optimizedImage = await sharp(file.buffer)
      .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: path,
      Body: optimizedImage,
      ContentType: file.mimetype,
      ACL: "public-read", // Make file publicly accessible
    };

    const result = await s3.upload(params).promise();
    return result.Location; // Returns the public URL directly
  } catch (error) {
    console.error("S3 upload error:", error);
    throw error;
  }
};

const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error("S3 delete error:", error);
    throw error;
  }
};

module.exports = { uploadToS3, deleteFromS3 };
