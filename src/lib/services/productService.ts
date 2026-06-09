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

export type CreateProductRequest = {
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  discount: number;
  productItems: {
    productItemId: string;
    quantity: number;
  }[];
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get<Product[]>("/api/Product");
  return response.data;
};


export const createProduct = async (
  request: CreateProductRequest
): Promise<void> => {
  await api.post("/api/Product", request);
};

export const uploadProductImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await api.post<string>("/images", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
