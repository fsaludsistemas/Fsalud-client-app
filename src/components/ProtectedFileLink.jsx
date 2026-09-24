import { useState } from "react";
import { fetchProtectedFile } from "../utils/protectedFile";

const ProtectedFileLink = ({ url, children = "ver" }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (event) => {
    event.preventDefault();
    if (!url || loading) return;
    const newWindow = window.open("about:blank", "_blank");
    setLoading(true);
    try {
      const fileUrl = await fetchProtectedFile(url);
      if (newWindow) newWindow.location.href = fileUrl;
      else window.location.href = fileUrl;
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
    } catch (error) {
      newWindow?.close();
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <a href={url || "#"} onClick={handleClick} aria-disabled={loading}>
      {loading ? "Cargando..." : children}
    </a>
  );
};

export default ProtectedFileLink;
