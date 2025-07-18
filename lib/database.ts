import { ref, push, set, get, onValue, off } from 'firebase/database';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { database, firestore } from './firebase';

// Realtime Database operations
export const realtimeDB = {
  // User profile
  setUserProfile: async (userId: string, profile: any) => {
    const userRef = ref(database, `users/${userId}/profile`);
    await set(userRef, profile);
  },

  // Expenses
  addExpense: async (userId: string, expense: any) => {
    const expensesRef = ref(database, `users/${userId}/expenses`);
    const newExpenseRef = push(expensesRef);
    await set(newExpenseRef, {
      ...expense,
      id: newExpenseRef.key,
      timestamp: Date.now(),
    });
    return newExpenseRef.key;
  },

  // Real-time listeners
  onUserExpensesChange: (userId: string, callback: (expenses: any[]) => void) => {
    const expensesRef = ref(database, `users/${userId}/expenses`);
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      const expenses = data ? Object.values(data) : [];
      callback(expenses);
    });
    return unsubscribe;
  },

  // Remove listener
  off: (ref: any, callback: any) => {
    off(ref, callback);
  },
};

// Firestore operations (for complex queries and analytics)
export const firestoreDB = {
  // Add expense to Firestore
  addExpense: async (userId: string, expense: any) => {
    const expensesRef = collection(firestore, `users/${userId}/expenses`);
    const docRef = await addDoc(expensesRef, {
      ...expense,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  },

  // Get user expenses
  getUserExpenses: async (userId: string) => {
    const expensesRef = collection(firestore, `users/${userId}/expenses`);
    const q = query(expensesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Get expenses by category
  getExpensesByCategory: async (userId: string, category: string) => {
    const expensesRef = collection(firestore, `users/${userId}/expenses`);
    const q = query(expensesRef, where('category', '==', category), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Update user profile
  updateUserProfile: async (userId: string, profile: any) => {
    const userRef = doc(firestore, `users/${userId}`);
    await updateDoc(userRef, {
      ...profile,
      updatedAt: new Date(),
    });
  },

  // SIP calculations
  saveSIPCalculation: async (userId: string, calculation: any) => {
    const sipRef = collection(firestore, `users/${userId}/sip_calculations`);
    const docRef = await addDoc(sipRef, {
      ...calculation,
      createdAt: new Date(),
    });
    return docRef.id;
  },

  // Tax optimization
  saveTaxOptimization: async (userId: string, optimization: any) => {
    const taxRef = collection(firestore, `users/${userId}/tax_optimizations`);
    const docRef = await addDoc(taxRef, {
      ...optimization,
      createdAt: new Date(),
    });
    return docRef.id;
  },
};

// Fi Money MCP integration
export const fiMoneyAPI = {
  getProfile: async (userId: string) => {
    // Mock implementation - replace with actual Fi Money MCP API calls
    return {
      id: userId,
      name: 'User Name',
      email: 'user@example.com',
      balance: 50000,
      income: 80000,
      investments: 150000,
    };
  },

  getTransactions: async (userId: string) => {
    // Mock implementation - replace with actual Fi Money MCP API calls
    return [
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
    ];
  },

  getAssets: async (userId: string) => {
    // Mock implementation
    return {
      total: 150000,
      breakdown: {
        stocks: 80000,
        bonds: 30000,
        mutualFunds: 40000,
      },
    };
  },
};