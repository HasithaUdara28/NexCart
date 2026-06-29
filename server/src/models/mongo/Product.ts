import { Schema, model, Document } from 'mongoose';

interface IReview {
  userId: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  ratings: number;
  reviews: IReview[];
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0, min: 0 },
    ratings: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true }
);

export const Product = model<IProduct>('Product', productSchema);
