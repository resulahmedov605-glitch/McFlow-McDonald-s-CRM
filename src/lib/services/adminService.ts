import api from "../../store/apiStore";

export type AdminUser = {
  id: string;
  fullName: string | null;
  username: string | null;
  email: string | null;
  role: string | null;
  imageUrl?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  loginedAt: string | null;
};

export type AdminCreateUser = {
  fullName: string;
  username: string;
  email: string;
  password: string;
};

export const getUsers = async () => {
  const response = await api.get<AdminUser[]>("/api/Admin/users");
  return response.data;
};

export const createUser = async (userData: AdminCreateUser) => {
  const response = await api.post("/api/Admin/create-user", userData);
  return response.data;
};

export const changeUserProfilePic = async (userId: string, formFile: File) => {
  const formData = new FormData();
  formData.append("file", formFile, formFile.name);

  const response = await api.patch(
    `/api/Admin/users/${userId}/profilepicture`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
