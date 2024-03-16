
import {Assets, Blockfrost, Lucid} from "@anastasia-labs/lucid-cardano-fork"

//const lucid = await Lucid.new();

const lucid = await Lucid.new(
    new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", "previewL7VRnBQHYkBR9rd6GrKvSzRuCQ7JgTml"),"Preview",
  );

const seed = lucid.utils.generateSeedPhrase();

console.log (seed);

lucid.selectWalletFromSeed("morning gym kite cloud nest prevent gym work cricket fox flush panther rough hub attract inform unaware armed farm round script cat ritual budget");

const addr = await lucid.wallet.address();

console.log (addr);

const utxo = await lucid.utxosAt(addr);

console.log (utxo)

const asset: Assets = {
    lovelace : 5_000_000n,
};

const useraddr = "addr_test1qrxg3q38zy2jnglk8g9623r0v07uur6lzu4ua0u3r9v0lpvvls2rjx6fmdgrdedlxn65hydc365m9dj477da2ppkatmqj3ppnt";

const tx = await lucid.newTx().payToAddress (useraddr,asset).complete();

console.log (tx.txComplete.to_json());

const signedTx = await tx.sign().complete();

console.log (signedTx.txSigned.to_json());

const txhash= await signedTx.submit();

console.log (txhash.toString);
