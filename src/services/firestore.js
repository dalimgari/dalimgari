import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs
} from "firebase/firestore";
import app from "../config/firebase";

export const db = getFirestore(app);

export const getDocument = async (collectionName, documentId) => {
  const snapshot = await getDoc(doc(db, collectionName, documentId));

  return snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;
};

export const setDocument = (collectionName, documentId, data) =>
  setDoc(doc(db, collectionName, documentId), data, { merge: true });

export const updateDocument = (collectionName, documentId, data) =>
  updateDoc(doc(db, collectionName, documentId), data);

export const deleteDocument = (collectionName, documentId) =>
  deleteDoc(doc(db, collectionName, documentId));

export const addDocument = (collectionName, data) =>
  addDoc(collection(db, collectionName), data);

export const getCollection = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
};
