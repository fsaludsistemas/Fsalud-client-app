import { getIdToken } from "../auth/authService";
import apiClient from "../api/apiClient";

const getStoragePath = (fileUrl) => {
  const parsedUrl = new URL(fileUrl);
  const objectMarker = "/o/";
  const markerIndex = parsedUrl.pathname.indexOf(objectMarker);
  if (markerIndex >= 0) {
    return decodeURIComponent(parsedUrl.pathname.slice(markerIndex + objectMarker.length));
  }

  const bucketPrefix = parsedUrl.pathname.split("/").filter(Boolean)[0];
  return decodeURIComponent(
    parsedUrl.pathname.slice(`/${bucketPrefix}/`.length),
  );
};

export const fetchProtectedFile = async (url) => {
  if (!url) return null;
  const token = await getIdToken();
  const path = getStoragePath(url);
  const response = await fetch(
    `${apiClient.defaults.baseURL}/storage/file?path=${encodeURIComponent(path)}`,
    {
    headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) throw new Error(`No se pudo consultar el archivo (${response.status}).`);
  return URL.createObjectURL(await response.blob());
};
