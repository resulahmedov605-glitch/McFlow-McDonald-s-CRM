import api from "../../store/apiStore";

export type ProductItem = {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  stock: number;
};


export const getProductItems = async (): Promise<ProductItem[]> => {
  const response = await api.get<ProductItem[]>("/api/ProductItems");
  return response.data;
};