import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, googleProvider } from "../auth/config";

/**
 * Inicia sesión con Google y verifica que el email esté en la lista blanca
 * (colección "usuarios" con estado ACTIVO).
 *
 * Retorna los datos del usuario junto con el idToken para futuras peticiones al API.
 */
export const loginConGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const { email } = result.user;

  // Verificación en lista blanca (colección "usuarios" en minúsculas)
  const q = query(
    collection(db, "usuarios"),
    where("email", "==", email.toLowerCase()),
    where("estado", "==", "ACTIVO")
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    await firebaseSignOut(auth);
    throw new Error("Tu correo no tiene acceso a esta aplicación.");
  }

  const userData = snapshot.docs[0].data();

  // Obtener el idToken para enviarlo en las peticiones al servidor
  const idToken = await result.user.getIdToken();

  return {
    email,
    permiso: userData.permiso,
    dependencia_actual: userData.dependencia_actual ?? null,
    idToken,
  };
};

/**
 * Obtiene un idToken fresco del usuario actual.
 * Úsalo como Bearer token en cada petición al API del servidor.
 * Firebase lo renueva automáticamente si está expirado.
 */
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay usuario autenticado");
  return user.getIdToken();
};

export const logout = async () => {
  await firebaseSignOut(auth);
};