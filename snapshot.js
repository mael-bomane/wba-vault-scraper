"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignatures = void 0;
const web3_js_1 = require("@solana/web3.js");
const fs_1 = __importDefault(require("fs"));
const PROGRAM_ID = new web3_js_1.PublicKey('D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o');
const interval = 1000;
const getSignatures = () => __awaiter(void 0, void 0, void 0, function* () {
    const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)('devnet'));
    const signatures = yield connection.getSignaturesForAddress(PROGRAM_ID);
    console.log(`parsing ${signatures.length} signatures`);
    const signers = [];
    signatures.forEach((_a, index_1) => __awaiter(void 0, [_a, index_1], void 0, function* ({ signature }, index) {
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            const tx = yield connection.getTransaction(signature);
            if (tx) {
                const { transaction: { message } } = tx;
                console.log(`now in signature ${index}`);
                // depends program & instruction : here signer is [0] after testing for my own pubkey
                const x = message.accountKeys[0].toString();
                signers.push(x);
                console.log(x);
            }
            if (index == (signatures.length - 1)) {
                console.log(`done processing ${signatures.length}`);
                const set = [...new Set(signers)];
                fs_1.default.writeFile('./signers.json', JSON.stringify(set), err => {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.error(`file written, ${set.length} unique signers found`);
                    }
                });
            }
        }), index * interval);
    }));
});
exports.getSignatures = getSignatures;
(0, exports.getSignatures)();
