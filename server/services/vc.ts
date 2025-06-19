import { SignJWT, jwtVerify } from 'jose';
import { signEd25519, verifyEd25519, signSecp256k1, verifySecp256k1 } from './crypto.js';
import { v4 as uuidv4 } from 'uuid';

export interface VerifiableCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
}

export async function issueVerifiableCredential(
  issuerDid: string,
  subjectDid: string,
  credentialType: string,
  claims: Record<string, any>,
  privateKey: string,
  keyType: string
): Promise<VerifiableCredential> {
  const now = new Date().toISOString();
  const credentialId = `urn:uuid:${uuidv4()}`;
  
  const credential: Omit<VerifiableCredential, 'proof'> = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1"
    ],
    id: credentialId,
    type: ["VerifiableCredential", credentialType],
    issuer: issuerDid,
    issuanceDate: now,
    credentialSubject: {
      id: subjectDid,
      ...claims
    }
  };
  
  // Create proof
  const message = new TextEncoder().encode(JSON.stringify(credential));
  const privateKeyBytes = Buffer.from(privateKey, 'hex');
  
  let signature: Uint8Array;
  let proofType: string;
  
  if (keyType === "ed25519") {
    signature = signEd25519(message, privateKeyBytes);
    proofType = "Ed25519Signature2020";
  } else {
    signature = signSecp256k1(message, privateKeyBytes);
    proofType = "EcdsaSecp256k1Signature2019";
  }
  
  const proof = {
    type: proofType,
    created: now,
    verificationMethod: `${issuerDid}#${issuerDid.split(':')[2]}`,
    proofPurpose: "assertionMethod",
    proofValue: 'z' + Buffer.from(signature).toString('base64')
  };
  
  return {
    ...credential,
    proof
  };
}

export async function verifyVerifiableCredential(
  credential: VerifiableCredential,
  issuerPublicKey: string,
  keyType: string
): Promise<{
  verified: boolean;
  issuer: string;
  subject: string;
  issuanceDate: string;
  errors?: string[];
}> {
  try {
    const errors: string[] = [];
    
    // Verify structure
    if (!credential["@context"] || !credential.type || !credential.issuer || !credential.credentialSubject) {
      errors.push("Invalid credential structure");
    }
    
    if (!credential.proof || !credential.proof.proofValue) {
      errors.push("Missing or invalid proof");
    }
    
    if (errors.length > 0) {
      return {
        verified: false,
        issuer: credential.issuer || "",
        subject: credential.credentialSubject?.id || "",
        issuanceDate: credential.issuanceDate || "",
        errors
      };
    }
    
    // Verify signature
    const { proof, ...credentialWithoutProof } = credential;
    const message = new TextEncoder().encode(JSON.stringify(credentialWithoutProof));
    const publicKeyBytes = Buffer.from(issuerPublicKey, 'hex');
    
    // Decode signature from base64
    const signatureBytes = Buffer.from(proof.proofValue.substring(1), 'base64');
    
    let verified = false;
    if (keyType === "ed25519" && proof.type === "Ed25519Signature2020") {
      verified = verifyEd25519(signatureBytes, message, publicKeyBytes);
    } else if (keyType === "secp256k1" && proof.type === "EcdsaSecp256k1Signature2019") {
      verified = verifySecp256k1(signatureBytes, message, publicKeyBytes);
    } else {
      errors.push("Unsupported signature type or key mismatch");
    }
    
    if (!verified) {
      errors.push("Invalid signature");
    }
    
    return {
      verified: verified && errors.length === 0,
      issuer: credential.issuer,
      subject: credential.credentialSubject.id,
      issuanceDate: credential.issuanceDate,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    return {
      verified: false,
      issuer: credential.issuer || "",
      subject: credential.credentialSubject?.id || "",
      issuanceDate: credential.issuanceDate || "",
      errors: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}
