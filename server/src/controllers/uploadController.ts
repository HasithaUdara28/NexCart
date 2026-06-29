import { Request, Response } from 'express';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../config/s3';

const s3Url = (key: string): string =>
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
  const key = `products/${filename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket:      process.env.AWS_BUCKET_NAME!,
      Key:         key,
      Body:        file.buffer,
      ContentType: file.mimetype,
    })
  );

  return s3Url(key);
};

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    const url = await uploadToS3(req.file);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err });
  }
};

export const uploadImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ message: 'No image files provided' });
      return;
    }

    const urls = await Promise.all(files.map(uploadToS3));
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err });
  }
};

export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.body;
    if (!key) {
      res.status(400).json({ message: 'Image key is required' });
      return;
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key:    key,
      })
    );

    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err });
  }
};
