import { generateEd25519KeyPair, generateSecp256k1KeyPair, type KeyPair } from './crypto.js';
import { base58btc } from 'multiformats/bases/base58';

export interface DIDDocument {
  "@context": string[];
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase: string;
  }>;
  authentication?: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
}

export function generateDidKey(keyType: "ed25519" | "secp256k1"): {
  did: string;
  keyPair: KeyPair;
  didDocument: DIDDocument;
} {
  let keyPair: KeyPair;
  let multicodecPrefix: Uint8Array;
  
  if (keyType === "ed25519") {
    keyPair = generateEd25519KeyPair();
    // Ed25519 multicodec prefix (0xed)
    multicodecPrefix = new Uint8Array([0xed, 0x01]);
  } else {
    keyPair = generateSecp256k1KeyPair();
    // secp256k1 multicodec prefix (0xe7)
    multicodecPrefix = new Uint8Array([0xe7, 0x01]);
  }
  
  // Create multibase encoded public key
  const publicKeyBytes = new Uint8Array(multicodecPrefix.length + keyPair.publicKey.length);
  publicKeyBytes.set(multicodecPrefix);
  publicKeyBytes.set(keyPair.publicKey, multicodecPrefix.length);
  
  const publicKeyMultibase = 'z' + base58btc.encode(publicKeyBytes).substring(1);
  const did = `did:key:${publicKeyMultibase}`;
  
  const didDocument: DIDDocument = {
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: did,
    verificationMethod: [{
      id: `${did}#${publicKeyMultibase}`,
      type: keyType === "ed25519" ? "Ed25519VerificationKey2020" : "EcdsaSecp256k1VerificationKey2019",
      controller: did,
      publicKeyMultibase
    }],
    authentication: [`${did}#${publicKeyMultibase}`],
    assertionMethod: [`${did}#${publicKeyMultibase}`],
    capabilityInvocation: [`${did}#${publicKeyMultibase}`],
    capabilityDelegation: [`${did}#${publicKeyMultibase}`]
  };
  
  return { did, keyPair, didDocument };
}

export function resolveDid(did: string, publicKey: string, keyType: string): DIDDocument {
  const verificationMethodType = keyType === "ed25519" 
    ? "Ed25519VerificationKey2020" 
    : "EcdsaSecp256k1VerificationKey2019";
    
  const keyId = did.split(':')[2];
  
  return {
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: did,
    verificationMethod: [{
      id: `${did}#${keyId}`,
      type: verificationMethodType,
      controller: did,
      publicKeyMultibase: keyId
    }],
    authentication: [`${did}#${keyId}`],
    assertionMethod: [`${did}#${keyId}`],
    capabilityInvocation: [`${did}#${keyId}`],
    capabilityDelegation: [`${did}#${keyId}`]
  };
}
