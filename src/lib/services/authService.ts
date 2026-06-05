import api from "../../store/apiStore";

export type LoginRequest = {
  usernameOrEmail: string;
  password: string;
};

export type VerifyRequest = {
  code: string;
  usernameOrEmail: string;
};

export type VerifyResponse = {
  accessToken: string;
  refreshToken: string;
};

export type MeResponse = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  loginedAt: string;

};

export const login = async (request: LoginRequest) => {
  const response = await api.post("/api/Auth/login", request, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));

  return url;
};

export const verify = async (request: VerifyRequest) => {
  const response = await api.post<VerifyResponse>(
    "/api/Auth/verify-2fa",
    request
  );
  return response.data;
};

export const getMe = async () => {
  const response = await api.get<MeResponse>("/api/Auth/me");
  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post<VerifyResponse>("/api/Auth/refresh-token", {
    accessToken: localStorage.getItem("mcflow_access_token") || "",
    refreshToken: localStorage.getItem("mcflow_refresh_token") || ""
  });
  return response.data;
};
