import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import app from "../config/firebase";

export const auth = getAuth(app);

export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const observeAuth = (callback) =>
  onAuthStateChanged(auth, callback);
