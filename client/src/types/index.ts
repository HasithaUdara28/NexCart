export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

export interface Review {
  userId: string;
  name: string;
  comment: string;
  rating: number;
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  ratings: number;
  reviews: Review[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  userId: number;
  total: number;
  status: string;
  stripePaymentId: string;
  items: OrderItem[];
  createdAt: string;
}
