// db.ts (Refactored and Optimized)
import {
  ref,
  push,
  set,
  onValue,
  off,
} from 'firebase/database';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { database, firestore } from './firebase';

// Utility to ensure parent user document exists
async function ensureUserDocExists(userId: string) {
  const userRef = doc(firestore, 'users', userId);
  await setDoc(userRef, { createdAt: serverTimestamp() }, { merge: true });
}

// Realtime Database
export const realtimeDB = {
  setUserProfile: async (userId: string, profile: any) => {
    const userRef = ref(database, `users/${userId}/profile`);
    await set(userRef, profile);
  },

  addExpense: async (userId: string, expense: any) => {
    const expensesRef = ref(database, `users/${userId}/expenses`);
    const newRef = push(expensesRef);
    await set(newRef, {
      ...expense,
      id: newRef.key,
      timestamp: Date.now(),
    });
    return newRef.key;
  },

  onUserExpensesChange: (userId: string, callback: (expenses: any[]) => void) => {
    const expensesRef = ref(database, `users/${userId}/expenses`);
    return onValue(expensesRef, (snap) => {
      const data = snap.val();
      const expenses = data ? Object.values(data) : [];
      callback(expenses);
    });
  },

  off,
};

// Firestore
export const firestoreDB = {
  addExpense: async (userId: string, expense: any) => {
    await ensureUserDocExists(userId);
    const expensesRef = collection(firestore, `users/${userId}/expenses`);
    const docRef = await addDoc(expensesRef, {
      ...expense,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  getUserExpenses: async (userId: string) => {
    const expensesRef = collection(firestore, `users/${userId}/expenses`);
    const q = query(expensesRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  getExpensesByCategory: async (userId: string, category: string) => {
    const expensesRef = collection(firestore, `users/${userId}/expenses`);
    const q = query(
      expensesRef,
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  updateUserProfile: async (userId: string, profile: any) => {
    await ensureUserDocExists(userId);
    const userRef = doc(firestore, `users/${userId}`);
    await updateDoc(userRef, {
      ...profile,
      updatedAt: serverTimestamp(),
    });
  },
  // save the user SIP
  saveSIPCalculation: async (userId: string, calculation: any) => {
    await ensureUserDocExists(userId);
    const sipRef = collection(firestore, `users/${userId}/sip_calculations`);
    const docRef = await addDoc(sipRef, {
      ...calculation
    });
    return docRef.id;
  },

  saveTaxOptimization: async (userId: string, optimization: any) => {
    await ensureUserDocExists(userId);
    const taxRef = collection(firestore, `users/${userId}/tax_optimizations`);
    const docRef = await addDoc(taxRef, {
      ...optimization
    });
    return docRef.id;
  },
};

// Mock Fi Money API (can be replaced later)
export const fiMoneyAPI = {
  getProfile: async (userId: string) => ({
    id: userId,
    name: 'User Name',
    email: 'user@example.com',
    balance: 50000,
    income: 80000,
    investments: 150000,
  }),

  getTransactions: async (userId: string) => [
    {
      id: '1',
      amount: -500,
      description: 'Grocery Store',
      date: new Date().toISOString(),
      category: 'Food',
    },
    {
      id: '2',
      amount: -200,
      description: 'Gas Station',
      date: new Date().toISOString(),
      category: 'Transportation',
    },
  ],

  getAssets: async (userId: string) => ({
    total: 150000,
    breakdown: {
      stocks: 80000,
      bonds: 30000,
      mutualFunds: 40000,
    },
  }),
};
