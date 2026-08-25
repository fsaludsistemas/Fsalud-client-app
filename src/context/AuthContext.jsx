import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../auth/config";
import { loginConGoogle as googleSignIn } from "../auth/authService";

const AuthContext = createContext(null);

const extractNameFromEmail = (email) => {
  if (!email) return "";
  const prefix = email.split("@")[0];
  const parts = prefix.split(/[._-]/);
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser) => {
    try {
      const email = firebaseUser.email;
      const q = query(
        collection(db, "usuarios"),
        where("email", "==", email.toLowerCase()),
        where("estado", "==", "ACTIVO")
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await firebaseSignOut(auth);
        setUser(null);
        return;
      }

      const userData = snapshot.docs[0].data();
      const idToken = await firebaseUser.getIdToken();

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: extractNameFromEmail(firebaseUser.email),
        permiso: userData.permiso,
        dependencia_actual: userData.dependencia_actual ?? null,
        idToken,
      });
    } catch (error) {
      console.error("Error fetching user data from Firestore:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const result = await googleSignIn();
      const parsedUser = {
        ...result,
        displayName: extractNameFromEmail(result.email),
      };
      setUser(parsedUser);
      return parsedUser;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
