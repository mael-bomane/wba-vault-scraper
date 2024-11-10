import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';

const PROGRAM_ID = new PublicKey('D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o');
const interval = 1000;

export const getSignatures = async () => {
  const connection = new Connection(clusterApiUrl('devnet'));
  const signatures = await connection.getSignaturesForAddress(PROGRAM_ID);
  console.log(`parsing ${signatures.length} signatures`);
  const signers: string[] = [];
  signatures.forEach(async ({ signature }, index) => {
    setTimeout(async () => {
      const tx = await connection.getTransaction(signature);
      if (tx) {
        const { transaction: { message } } = tx;
        console.log(`now in signature ${index}`);
        const x = message.accountKeys[0].toString();
        signers.push(x);
        console.log(x);
      }
      if (index == (signatures.length - 1)) {
        console.log(`done processing ${signatures.length}`);
        const set = [...new Set(signers)];
        fs.writeFile('./signers.json', JSON.stringify(set), err => {
          if (err) {
            console.error(err);
          } else {
            console.error(`file written, ${set.length} unique signers found`);
          }
        });
      }
    }, index * interval)
  })
};

getSignatures();
