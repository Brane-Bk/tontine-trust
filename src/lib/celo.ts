import { createWalletClient, http, hashMessage, recoverMessageAddress } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { celoAlfajores } from 'viem/chains';

// Simulate a Celo provider for signing "Reconnaissance de dette"
export const generateDocumentText = (groupId: string, memberName: string, amount: number) => {
  return `Je soussigné, ${memberName}, reconnais avoir reçu la somme de ${amount} FCFA au titre de ma tontine dans le groupe ${groupId}.`;
};

export const generateDocumentHash = (documentText: string) => {
  return hashMessage(documentText);
};

export const signDocument = async (documentHash: `0x${string}`) => {
  // In a real app with wallet connect, we would use the injected Web3 provider.
  // Here we simulate an account signature using a randomly generated ephemeral key.
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  
  const client = createWalletClient({
    account,
    chain: celoAlfajores,
    transport: http()
  });

  const signature = await client.signMessage({ message: { raw: documentHash } });
  return { signature, address: account.address };
};

export const verifySignature = async (documentHash: `0x${string}`, signature: `0x${string}`, expectedAddress: `0x${string}`) => {
  const recoveredAddress = await recoverMessageAddress({
    message: { raw: documentHash },
    signature,
  });
  return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
};
