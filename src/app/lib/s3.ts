import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

export const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_KEY!,
    },
});

export const uploadToS3 = async (params: {
    Bucket: string;
    Key: string;
    Body: Readable | Buffer | string;
    ContentType: string;
}) => {
    console.log('Uploading to S3:', { bucket: params.Bucket, key: params.Key, contentType: params.ContentType });
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: params.Bucket,
            Key: params.Key,
            Body: params.Body,
            ContentType: params.ContentType,
        },
    });
    const result = await upload.done();
    console.log('S3 upload completed:', result);
    return result;
};

export const getSignedS3Url = async (Bucket: string, Key: string, Expires: number) => {
    console.log('Generating signed URL for:', { bucket: Bucket, key: Key, expires: Expires });
    const command = new GetObjectCommand({ Bucket, Key });
    const url = await getSignedUrl(s3Client, command, { expiresIn: Expires });
    console.log('Signed URL generated:', url);
    return url;
};

export const getObjectFromS3 = async (Bucket: string, Key: string) => {
    console.log('Fetching object from S3:', { bucket: Bucket, key: Key });
    const command = new GetObjectCommand({ Bucket, Key });
    const response = await s3Client.send(command);
    console.log('S3 object fetched:', { bucket: Bucket, key: Key, contentLength: response.ContentLength });
    return response.Body;
};

export const listObjectsFromS3 = async (Bucket: string, Prefix: string) => {
    console.log('Listing objects from S3:', { bucket: Bucket, prefix: Prefix });
    const command = new ListObjectsV2Command({ Bucket, Prefix });
    const response = await s3Client.send(command);
    console.log('S3 objects listed:', { count: response.Contents?.length || 0 });
    return response.Contents || [];
};