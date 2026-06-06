import api from "../../store/apiStore";

export type Product = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  discount: number;
  productItemsTotalPrice: number;
};

export const getProducts = async (): Promise<Product[]> => {
    const response = await api.get<Product[]>("/api/Product");
    return response.data;
};