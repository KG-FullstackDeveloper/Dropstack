export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  createdAt: string;
  mediaUrls: string[];
}

export interface ReviewSubmission {
  productId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  body: string;
}