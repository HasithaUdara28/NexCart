import { Request, Response } from 'express';
import { Product } from '../models/mongo/Product';
import { prisma } from '../config/prisma';

interface ProductFilter {
  name?: { $regex: string; $options: string };
  category?: string;
  price?: { $gte?: number; $lte?: number };
}

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  price_asc:  { price: 1 },
  price_desc: { price: -1 },
  newest:     { createdAt: -1 },
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, minPrice, maxPrice, sort, page = '1', limit = '12' } = req.query;

    const filter: ProductFilter = {};
    if (search)   filter.name     = { $regex: String(search), $options: 'i' };
    if (category) filter.category = String(category);
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;
    const sortOpt  = SORT_MAP[String(sort)] ?? { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOpt).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, stock, images } = req.body;
    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      images: images ?? [],
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const addReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, comment } = req.body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5' });
      return;
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const userId = String(req.user!.id);
    if (product.reviews.some((r) => r.userId === userId)) {
      res.status(400).json({ message: 'You have already reviewed this product' });
      return;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true },
    });

    product.reviews.push({
      userId,
      name:    dbUser?.name ?? 'Anonymous',
      rating:  Number(rating),
      comment: comment ?? '',
      createdAt: new Date(),
    });

    product.ratings =
      product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
