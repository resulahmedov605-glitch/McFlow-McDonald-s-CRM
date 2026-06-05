import { API_BASE_URL } from "../store/apiStore";

export type ProfilePictureSource = {
  imageUrl?: string | null;
};

const profilePictureFields = [
  "imageUrl",
] as const;

export const getProfilePictureUrl = (
  source?: ProfilePictureSource | null,
  version?: string | null
) => {
  if (!source) return "";

  const rawValue = profilePictureFields
    .map((field) => source[field])
    .find((value) => value?.trim());

  if (!rawValue) return "";

  const value = rawValue.trim();
  const url = /^(https?:|blob:|data:)/i.test(value)
    ? value
    : new URL(value, `${API_BASE_URL}/`).toString();

  if (!version || /^(blob:|data:)/i.test(url)) return url;

  const parsedUrl = new URL(url);

  if (parsedUrl.search) return url;

  parsedUrl.searchParams.set("v", version);

  return parsedUrl.toString();
};
