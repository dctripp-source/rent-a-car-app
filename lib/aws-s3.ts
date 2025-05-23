import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const uploadToS3 = async (file: File): Promise<string> => {
  const fileKey = `vehicles/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: fileKey,
    Body: buffer,
    ContentType: file.type,
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  const fileKey = fileUrl.split('/').slice(-2).join('/');
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: fileKey,
  };

  await s3.deleteObject(params).promise();
};