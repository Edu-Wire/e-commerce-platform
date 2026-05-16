import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { env } from '../config/env';

const s3Client = new S3Client({
  region: env.aws.region,
  credentials: {
    accessKeyId: env.aws.accessKeyId,
    secretAccessKey: env.aws.secretAccessKey,
  },
});

export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'products'
): Promise<string> => {
  try {
    // 1. Process and Compress Image with Sharp
    const compressedImageBuffer = await sharp(file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}.webp`;

    // 2. Upload to S3
    const params = {
      Bucket: env.aws.bucketName,
      Key: fileName,
      Body: compressedImageBuffer,
      ContentType: 'image/webp',
    };

    await s3Client.send(new PutObjectCommand(params));
    
    return `https://${env.aws.bucketName}.s3.${env.aws.region}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('Error in uploadToS3:', error);
    throw new Error('Failed to upload image to S3');
  }
};
