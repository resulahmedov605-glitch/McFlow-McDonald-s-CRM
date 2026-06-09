import api from "../../store/apiStore";

export type ProductItem = {
  id: string;
  name: string;
  unit: UnitType;
  pricePerUnit: number;
  stock: number;
};

export type CreateProductItemRequest = {
  name: string;
  unit: UnitType;
  pricePerUnit: number;
  stock: number;
};

export type UnitType =
  | "Grams"
  | "Kilograms"
  | "Liters"
  | "Milliliters"
  | "Pieces"
  | "Calories";

export const getProductItems = async (): Promise<ProductItem[]> => {
  const response = await api.get<ProductItem[]>("/api/ProductItems");
  return response.data;
};

export const createProductItem = async (
  request: CreateProductItemRequest
): Promise<void> => {
  await api.post("/api/ProductItems", request);
};
