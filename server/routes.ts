import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { 
  registerDidSchema, 
  issueVcSchema, 
  verifyVcSchema,
  type RegisterDidRequest,
  type IssueVcRequest,
  type VerifyVcRequest 
} from "@shared/schema.js";
import { generateDidKey, resolveDid } from "./services/did.js";
import { issueVerifiableCredential, verifyVerifiableCredential } from "./services/vc.js";
import { v4 as uuidv4 } from 'uuid';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Register new DID
  app.post("/api/register", async (req, res) => {
    try {
      const parsed = registerDidSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: parsed.error.issues 
        });
      }

      const { keyType, method } = parsed.data;
      
      if (method !== "did:key") {
        return res.status(400).json({ 
          message: "Only did:key method is currently supported" 
        });
      }

      const { did, keyPair, didDocument } = generateDidKey(keyType);

      const didData = {
        did,
        method,
        keyType,
        publicKey: keyPair.publicKeyHex,
        privateKey: keyPair.privateKeyHex,
        didDocument: didDocument as any,
      };

      const savedDid = await storage.createDid(didData);

      res.json({
        did: savedDid.did,
        publicKey: savedDid.publicKey,
        didDocument: savedDid.didDocument,
        keyType: savedDid.keyType,
      });
      
    } catch (error) {
      console.error("Error registering DID:", error);
      res.status(500).json({ 
        message: "Failed to register DID",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Resolve DID
  app.get("/api/resolve/:did", async (req, res) => {
    try {
      const { did } = req.params;
      
      if (!did || !did.startsWith("did:")) {
        return res.status(400).json({ 
          message: "Invalid DID format" 
        });
      }

      const savedDid = await storage.getDid(did);
      
      if (!savedDid) {
        return res.status(404).json({ 
          message: "DID not found" 
        });
      }

      res.json({
        didDocument: savedDid.didDocument,
        keyType: savedDid.keyType,
        publicKey: savedDid.publicKey,
      });
      
    } catch (error) {
      console.error("Error resolving DID:", error);
      res.status(500).json({ 
        message: "Failed to resolve DID",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Issue Verifiable Credential
  app.post("/api/issue-vc", async (req, res) => {
    try {
      const parsed = issueVcSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: parsed.error.issues 
        });
      }

      const { subjectDid, credentialType, claims } = parsed.data;

      // For simplicity, use the first available DID as issuer
      const allDids = await storage.getAllDids();
      if (allDids.length === 0) {
        return res.status(400).json({ 
          message: "No issuer DID available. Please register a DID first." 
        });
      }

      const issuerDid = allDids[0];
      
      const credential = await issueVerifiableCredential(
        issuerDid.did,
        subjectDid,
        credentialType,
        claims,
        issuerDid.privateKey,
        issuerDid.keyType
      );

      const vcData = {
        vcId: credential.id,
        issuer: credential.issuer,
        subject: credential.credentialSubject.id,
        credentialType,
        claims: claims as any,
        credential: credential as any,
        issuanceDate: new Date(credential.issuanceDate),
      };

      const savedVc = await storage.createVc(vcData);

      res.json({
        credential,
        vcId: savedVc.vcId,
      });
      
    } catch (error) {
      console.error("Error issuing VC:", error);
      res.status(500).json({ 
        message: "Failed to issue verifiable credential",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Verify Verifiable Credential
  app.post("/api/verify-vc", async (req, res) => {
    try {
      const parsed = verifyVcSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: parsed.error.issues 
        });
      }

      const { credential } = parsed.data;

      if (!credential.issuer) {
        return res.status(400).json({ 
          message: "Credential missing issuer" 
        });
      }

      // Get issuer DID to verify signature
      const issuerDidData = await storage.getDid(credential.issuer as string);
      if (!issuerDidData) {
        return res.status(404).json({ 
          message: "Issuer DID not found" 
        });
      }

      const verificationResult = await verifyVerifiableCredential(
        credential as any,
        issuerDidData.publicKey,
        issuerDidData.keyType
      );

      res.json(verificationResult);
      
    } catch (error) {
      console.error("Error verifying VC:", error);
      res.status(500).json({ 
        message: "Failed to verify credential",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ 
        message: "Failed to get statistics",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
