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
}

export type PaymentType = "Cash" | "Card";

export type ChangeOrderStatusDto = {
  orderId: string;
  status: OrderStatus;
}

export type OrderStatus = "Created" | "Approved" | "InProgress" | "Completed" | "Rejected";

export const createOrder = async (order: CreateOrder): Promise<void> => {
  await api.post(`/api/Orders`, order);
}

export const changeOrderStatus = async (dto: ChangeOrderStatusDto): Promise<void> => {
    await api.patch(`/api/Orders/${dto.orderId}/status`, { status: dto.status });
}

export const cancelOrder = async (orderId: string): Promise<void> => {
    await api.patch(`/api/Orders/${orderId}/cancel`);
}

export const completeOrder = async (orderId: string): Promise<void> => {
    await api.patch(`/api/Orders/${orderId}/complete`);
}