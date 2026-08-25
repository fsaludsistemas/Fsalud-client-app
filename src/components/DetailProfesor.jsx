
import { useEffect, useState } from "react";
import { useNavigate,useParams } from "react-router-dom";
import { getProfesorById } from "../api/apiClient";
const DetailProfesor = (id) => {
    const navigate = useNavigate();
    const [profesor, setProfesor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const profData = await getProfesorById(id);
            setProfesor(profData);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Error al cargar la información del servidor.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
  return (
    <div>DetailProfesor</div>
  )
}

export default DetailProfesor