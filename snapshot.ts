import { clusterApiUrl, ConfirmedSignatureInfo, Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs';

const PROGRAM_ID_1 = new PublicKey('D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o');
const PROGRAM_ID_2 = new PublicKey('HC2oqz2p6DEWfrahenqdq2moUcga9c9biqRBcdK3XKU1');
const PROGRAM_ID_3 = new PublicKey('WBA52hW35HZU5R2swG57oehbN2fTr7nNhNDgfjnqUoZ');


const interval = 1000;

const programs = [PROGRAM_ID_1, PROGRAM_ID_2, PROGRAM_ID_3];

export const getSignatures = async () => {
  const connection = new Connection(clusterApiUrl('devnet'));
  let signatures: ConfirmedSignatureInfo[] = [];

  programs.forEach(async (program, index) => {
    await connection.getSignaturesForAddress(program)
      .then((sigs) => {
        console.log("found : ", sigs.length, " signatures for program ", program.toString());
        signatures = signatures.concat(sigs);
        console.log("signatures to parse : ", signatures.length);
        if (index == programs.length - 1) {
          console.log(`reached last program ${program.toString()}, parsing ${signatures.length}`);
          const signers: string[] = [];
          signatures.forEach(async ({ signature }, i) => {
            setTimeout(async () => {
              const tx = await connection.getTransaction(signature).catch((err) => console.log(err));
              if (tx) {
                const { transaction: { message } } = tx;
                console.log(`now in signature ${i}`);
                try {
                  // depends program & instruction : here signer is [0] after testing for my own pubkey
                  const x = message.accountKeys[0].toString();
                  console.log(x);
                  signers.push(x);
                } catch (error) {
                  console.log(error)
                }
              }
              if (i == (signatures.length - 1)) {
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
            }, i * interval)
          })
        }
      });
  });
};

getSignatures();
