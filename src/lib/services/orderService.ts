import api from "../../store/apiStore";

export type CreateOrder = {
  creatorId: string;
  orderItems: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  paymentType: PaymentType;
};

export type PaymentType = 0 | 1;

export type ChangeOrderStatusDto = {
  orderId: string;
  status: OrderStatus;
};

export type Order = {
  id: string;
  creatorId: string;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
  }>;
};

export type OrderStatus = "Created" | "Approved" | "InProgress" | "Completed" | "Rejected";

export const createOrder = async (order: CreateOrder): Promise<void> => {
  await api.post("/api/Orders", { command: order });
};

export const changeOrderStatus = async (dto: ChangeOrderStatusDto): Promise<void> => {
    await api.patch(`/api/Orders/${dto.orderId}/status`, { status: dto.status });
}

export const cancelOrder = async (orderId: string): Promise<void> => {
    await api.patch(`/api/Orders/${orderId}/cancel`);
}

export const completeOrder = async (orderId: string): Promise<void> => {
    await api.patch(`/api/Orders/${orderId}/complete`);
}

export const getOrders = async (): Promise<Order[]> => {
    const response = await api.get<Order[]>(`/api/Orders`);
    return response.data;
}
