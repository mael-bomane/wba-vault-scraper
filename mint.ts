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

let keypair = umi.eddsa.createKeypairFromSecretKey(payerSecretKey);
const payer = Keypair.fromSecretKey(payerSecretKey);
console.log("Payer Public Key:", payer.publicKey.toBase58());

const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));

const mint = generateSigner(umi);

async function main() {
  // await umiSwitchToSoonDevnet(umi);

  console.log(`found ${addresses.length} addresses`);
  console.log(`adding signer to airdrop list`);

  addresses.unshift(myKeypairSigner.publicKey.toString());

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

  addresses.forEach(async (address, index) => {
    setTimeout(async () => {
      const txResponse = await mintV1(umi, {
        mint: mint.publicKey,
        tokenStandard: TokenStandard.Fungible,
        amount: new BN(100 * 1 * 10 ** 6),
        tokenOwner: publicKey(address)
      }).sendAndConfirm(umi);
      const txHash = base58.deserialize(txResponse.signature);
      console.log("Transaction hash:", txHash);
      console.log(`Success for ${address}`);
      if (index == addresses.length - 1) {
        console.log(`Done processing ${addresses.length} addresses !`)
      }
    }, index * 1000);
  });


}

main().catch(console.error);
