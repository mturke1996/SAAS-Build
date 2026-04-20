import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Client, Invoice, Payment, StandaloneDebt, Expense, ExpenseInvoice, DebtParty, Worker, UserBalance, GlobalFundTransaction, Letter } from '../types';

// Generic CRUD operations
export class FirestoreService<T extends { id: string }> {
  constructor(private collectionName: string) {}

  // Get all documents (real-time listener)
  subscribe(callback: (data: T[]) => void, qConstraints: QueryConstraint[] = []) {
    const q = query(collection(db, this.collectionName), ...qConstraints);
    return onSnapshot(q, (snapshot) => {
      const raw = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,        // Always use the Firestore doc ID as the canonical id
        _docId: d.id,     // Keep a reference to the Firestore doc ID for update/delete
      })) as unknown as T[];
      // Deduplicate by id to handle legacy mismatched IDs
      const deduped = [...new Map(raw.map(item => [item.id, item])).values()];
      callback(deduped);
    });
  }

  // Get all documents (one-time fetch)
  async getAll(qConstraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, this.collectionName), ...qConstraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      _docId: d.id,
    })) as unknown as T[];
  }

  // Get single document
  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  // Add document — uses setDoc with the provided id so Firestore doc ID matches app ID
  async add(data: any): Promise<string> {
    const id = data.id || crypto.randomUUID();
    const docRef = doc(db, this.collectionName, id);
    await setDoc(docRef, { ...data, id } as DocumentData);
    return id;
  }

  // Update document — checks existence first, then falls back to internal ID lookup
  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Document found by its Firestore doc ID — update it directly
      await setDoc(docRef, data as DocumentData, { merge: true });
    } else {
      // Fallback: the app's id might differ from the Firestore doc ID (legacy data)
      const q = query(collection(db, this.collectionName), where('id', '==', id));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const realRef = doc(db, this.collectionName, querySnap.docs[0].id);
        await setDoc(realRef, data as DocumentData, { merge: true });
      } else {
        console.warn(`[FirestoreService] update: document not found for id="${id}" in "${this.collectionName}"`);
      }
    }
  }

  // Delete document — checks existence first, then falls back to internal ID lookup
  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Document found by its Firestore doc ID — delete it
      await deleteDoc(docRef);
    } else {
      // Fallback: the app's id might differ from the Firestore doc ID (legacy data)
      const q = query(collection(db, this.collectionName), where('id', '==', id));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        await deleteDoc(doc(db, this.collectionName, querySnap.docs[0].id));
      } else {
        console.warn(`[FirestoreService] delete: document not found for id="${id}" in "${this.collectionName}"`);
      }
    }
  }
}

// Export instances for each collection
export const clientsService = new FirestoreService<Client>('clients');
export const invoicesService = new FirestoreService<Invoice>('invoices');
export const paymentsService = new FirestoreService<Payment>('payments');
export const expensesService = new FirestoreService<Expense>('expenses');
export const standaloneDebtsService = new FirestoreService<StandaloneDebt>('standalone_debts');
export const debtPartiesService = new FirestoreService<DebtParty>('debt_parties');
export const expenseInvoicesService = new FirestoreService<ExpenseInvoice>('expense_invoices');
export const workersService = new FirestoreService<Worker>('workers');
export const userBalancesService = new FirestoreService<UserBalance>('user_balances');
export const globalFundTransactionsService = new FirestoreService<GlobalFundTransaction>('global_fund_transactions');
export const lettersService = new FirestoreService<Letter>('letters');
