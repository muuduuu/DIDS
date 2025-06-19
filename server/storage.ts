import { 
  dids, 
  verifiableCredentials, 
  type Did, 
  type InsertDid, 
  type VerifiableCredential,
  type InsertVc 
} from "@shared/schema";

export interface IStorage {
  // DID operations
  getDid(did: string): Promise<Did | undefined>;
  createDid(didData: InsertDid): Promise<Did>;
  getAllDids(): Promise<Did[]>;
  
  // VC operations
  getVc(vcId: string): Promise<VerifiableCredential | undefined>;
  createVc(vcData: InsertVc): Promise<VerifiableCredential>;
  getAllVcs(): Promise<VerifiableCredential[]>;
  
  // Stats
  getStats(): Promise<{
    totalDids: number;
    vcsIssued: number;
    verified: number;
    activeKeys: number;
  }>;
}

export class MemStorage implements IStorage {
  private dids: Map<string, Did>;
  private vcs: Map<string, VerifiableCredential>;
  private currentDidId: number;
  private currentVcId: number;

  constructor() {
    this.dids = new Map();
    this.vcs = new Map();
    this.currentDidId = 1;
    this.currentVcId = 1;
  }

  async getDid(did: string): Promise<Did | undefined> {
    return Array.from(this.dids.values()).find(d => d.did === did);
  }

  async createDid(didData: InsertDid): Promise<Did> {
    const id = this.currentDidId++;
    const newDid: Did = {
      id,
      ...didData,
      createdAt: new Date(),
    };
    this.dids.set(newDid.did, newDid);
    return newDid;
  }

  async getAllDids(): Promise<Did[]> {
    return Array.from(this.dids.values());
  }

  async getVc(vcId: string): Promise<VerifiableCredential | undefined> {
    return this.vcs.get(vcId);
  }

  async createVc(vcData: InsertVc): Promise<VerifiableCredential> {
    const id = this.currentVcId++;
    const newVc: VerifiableCredential = {
      id,
      ...vcData,
      createdAt: new Date(),
    };
    this.vcs.set(newVc.vcId, newVc);
    return newVc;
  }

  async getAllVcs(): Promise<VerifiableCredential[]> {
    return Array.from(this.vcs.values());
  }

  async getStats(): Promise<{
    totalDids: number;
    vcsIssued: number;
    verified: number;
    activeKeys: number;
  }> {
    return {
      totalDids: this.dids.size,
      vcsIssued: this.vcs.size,
      verified: this.vcs.size, // For simplicity, assume all issued VCs are verified
      activeKeys: this.dids.size,
    };
  }
}

export const storage = new MemStorage();
