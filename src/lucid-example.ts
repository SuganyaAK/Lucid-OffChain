
import {Blockfrost, Lucid} from "@anastasia-labs/lucid-cardano-fork"

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