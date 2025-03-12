import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
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
    const upload = new Upload({
        client: s3Client,
        params: {
            Bucket: params.Bucket,
            Key: params.Key,
            Body: params.Body,
            ContentType: params.ContentType,
        },
    });
    await upload.done();
}

export const getSignedS3Url = async (Bucket: string, Key: string, Expires: number) => {
    const command = new GetObjectCommand({ Bucket, Key });
    return await getSignedUrl(s3Client, command, { expiresIn: Expires });
};

export const getObjectFromS3 = async (Bucket: string, Key: string) => {
    const command = new GetObjectCommand({ Bucket, Key });
    const response = await s3Client.send(command);
    return response.Body;
};