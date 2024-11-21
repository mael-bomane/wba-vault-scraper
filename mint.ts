import {
  percentAmount,
  generateSigner,
  some,
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
  Cluster,
  Umi,
} from "@metaplex-foundation/umi";
import { createFungible, mintV1, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { base58 } from "@metaplex-foundation/umi/serializers";
import payerWallet from './id.json';
import addresses from './signers.json';
import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

// Function to switch to SOON Devnet and register required programs
export async function umiSwitchToSoonDevnet(umi: Umi) {
  // Register Token Metadata Program
  umi.programs.add(
    {
      name: "mplTokenMetadata",
      publicKey: publicKey("6C4GR9AtMGF25sjXKtdB7A6NVQUudEQWw97kG61pGuA1"),
      getErrorFromCode: (code: number, cause?: Error) => null,
      getErrorFromName: (name: string, cause?: Error) => null,
      isOnCluster: (cluster: Cluster) => true,
    },
    true
  );

  // Register Candy Machine Core Program
  umi.programs.add(
    {
      name: "mplCandyMachineCore",
      publicKey: publicKey("GFmqavo1M8wEL3a4uouSCaDX5CJapcYWXTcZ4TK6L9ad"),
      getErrorFromCode: (code: number, cause?: Error) => null,
      getErrorFromName: (name: string, cause?: Error) => null,
      isOnCluster: (cluster: Cluster) => true,
    },
    true
  );

  // Register Candy Machine Program
  umi.programs.add(
    {
      name: "mplCandyMachine",
      publicKey: publicKey("GFmqavo1M8wEL3a4uouSCaDX5CJapcYWXTcZ4TK6L9ad"),
      getErrorFromCode: (code: number, cause?: Error) => null,
      getErrorFromName: (name: string, cause?: Error) => null,
      isOnCluster: (cluster: Cluster) => true,
    },
    true
  );

  (umi.programs as any).add(
    {
      name: "mplCandyGuard",
      publicKey: publicKey("3g5Pe9ZoDmhA4k1ooFhxgtMWNesTYRdrSAKWMfjr2YxH"),
      getErrorFromCode: (code: number, cause?: Error) => null,
      getErrorFromName: (name: string, cause?: Error) => null,
      isOnCluster: (cluster: Cluster) => true,
      // ignore errors
      availableGuards: [
        "botTax",
        "solPayment",
        "tokenPayment",
        "startDate",
        "thirdPartySigner",
        "tokenGate",
        "gatekeeper",
        "endDate",
        "allowList",
        "mintLimit",
        "nftPayment",
        "redeemedAmount",
        "addressGate",
        "nftGate",
        "nftBurn",
        "tokenBurn",
        "freezeSolPayment",
        "freezeTokenPayment",
        "programGate",
        "allocation",
        "token2022Payment",
      ],
    },
    true
  );
}
// Set up the Umi instance
//const umi = createUmi("https://rpc.devnet.soo.network/rpc").use(
const umi = createUmi("https://api.devnet.solana.com").use(
  mplTokenMetadata()
);

// Payer secret key for signing transactions
const payerSecretKey = new Uint8Array(payerWallet);

// Create keypair and signer
let keypair = umi.eddsa.createKeypairFromSecretKey(payerSecretKey);
const payer = Keypair.fromSecretKey(payerSecretKey);
console.log("Payer Public Key:", payer.publicKey.toBase58());

const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));

// Create a mint signer
const mint = generateSigner(umi);

const wallet = Keypair.fromSecretKey(new Uint8Array(payerWallet));

// Main function to create a fungible token
async function main() {
  // Switch Umi instance to SOON Devnet by adding necessary programs
  // await umiSwitchToSoonDevnet(umi);

  console.log(`found ${addresses.length} addresses`);

  // Create the fungible token (e.g., BONK)
  // const txResponse = await mintV1(umi, {
  //   mint: publicKey('6idLocKUQfSGMdjgqSdcAeY6vJedyx8RPZ4pC3HfSGzQ'),
  //   tokenStandard: TokenStandard.Fungible,
  //   amount: new BN(100 * 1 * 10 ** 6)
  // }).sendAndConfirm(umi);

  const txResponse = await createFungible(umi, {
    mint,
    name: "WBA",
    symbol: "WBA",
    uri: "https://raw.githubusercontent.com/mael-bomane/wba-vault-scraper/main/metadata.json",
    sellerFeeBasisPoints: percentAmount(0),
    decimals: some(6),
  }).sendAndConfirm(umi);

  const txHash = base58.deserialize(txResponse.signature);
  console.log("Transaction hash:", txHash);

  const connection = new Connection(clusterApiUrl('devnet'));

  addresses.forEach(async (address, index) => {
    setTimeout(async () => {
      const signerAta = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        new PublicKey(mint.publicKey.toString()),
        new PublicKey(address),
      );

      let tx = await mintTo(
        connection,
        wallet,
        new PublicKey(mint.publicKey.toString()),
        signerAta.address,
        wallet.publicKey,
        100 * 1 * 10 ** 6
      );
      console.log(`Success for ${address} :\nhttps://explorer.solana.com/tx/${tx}?cluster=devnet`);

    }, index * 1000);
  });


}

main().catch(console.error);
