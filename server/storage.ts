import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface StoredWallet {
  id: string;
  address: string;
  label: string;
  blockchain: "solana" | "bsc";
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Wallet operations
  getWallets(): Promise<StoredWallet[]>;
  getWallet(id: string): Promise<StoredWallet | undefined>;
  getWalletByAddress(address: string, blockchain: "solana" | "bsc"): Promise<StoredWallet | undefined>;
  addWallet(wallet: Omit<StoredWallet, "id">): Promise<StoredWallet>;
  removeWallet(id: string): Promise<boolean>;
  updateWalletLabel(id: string, label: string): Promise<StoredWallet | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private wallets: Map<string, StoredWallet>;

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Wallet operations
  async getWallets(): Promise<StoredWallet[]> {
    return Array.from(this.wallets.values());
  }

  async getWallet(id: string): Promise<StoredWallet | undefined> {
    return this.wallets.get(id);
  }

  async getWalletByAddress(address: string, blockchain: "solana" | "bsc"): Promise<StoredWallet | undefined> {
    return Array.from(this.wallets.values()).find(
      (wallet) => wallet.address.toLowerCase() === address.toLowerCase() && wallet.blockchain === blockchain
    );
  }

  async addWallet(wallet: Omit<StoredWallet, "id">): Promise<StoredWallet> {
    const id = randomUUID();
    const newWallet: StoredWallet = { ...wallet, id };
    this.wallets.set(id, newWallet);
    return newWallet;
  }

  async removeWallet(id: string): Promise<boolean> {
    return this.wallets.delete(id);
  }

  async updateWalletLabel(id: string, label: string): Promise<StoredWallet | undefined> {
    const wallet = this.wallets.get(id);
    if (wallet) {
      wallet.label = label;
      this.wallets.set(id, wallet);
      return wallet;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
