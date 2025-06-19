import { ed25519 } from '@noble/curves/ed25519';
import { secp256k1 } from '@noble/curves/secp256k1';
import { randomBytes } from 'crypto';

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  publicKeyHex: string;
  privateKeyHex: string;
}

export function generateEd25519KeyPair(): KeyPair {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  
  return {
    publicKey,
    privateKey,
    publicKeyHex: Buffer.from(publicKey).toString('hex'),
    privateKeyHex: Buffer.from(privateKey).toString('hex'),
  };
}

export function generateSecp256k1KeyPair(): KeyPair {
  const privateKey = secp256k1.utils.randomPrivateKey();
  const publicKey = secp256k1.getPublicKey(privateKey);
  
  return {
    publicKey,
    privateKey,
    publicKeyHex: Buffer.from(publicKey).toString('hex'),
    privateKeyHex: Buffer.from(privateKey).toString('hex'),
  };
}

export function signEd25519(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return ed25519.sign(message, privateKey);
}

export function verifyEd25519(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
  return ed25519.verify(signature, message, publicKey);
}

export function signSecp256k1(message: Uint8Array, privateKey: Uint8Array): Uint8Array {
  return secp256k1.sign(message, privateKey).toCompactRawBytes();
}

export function verifySecp256k1(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
  try {
    return secp256k1.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}
