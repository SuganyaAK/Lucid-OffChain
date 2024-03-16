

// sum.test.js
import { expect, test } from 'vitest'
import { sum } from '../src/sum.js'
import { Assets, Data, Emulator, Lucid, Script, fromText, generateSeedPhrase } from '@anastasia-labs/lucid-cardano-fork';
import script from '../test/MarketPlace.json'
import { MarketRedeemer, SimpleSale } from '../src/contractschema.js';
import { fromAddress,toAddress } from '../src/Utils.js';

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3)
});

export const generateAccountSeedPhrase = async (assets: Assets) => {
    const seedPhrase = generateSeedPhrase();
    return {
      seedPhrase,
      address: await (await Lucid.new(undefined, "Custom"))
        .selectWalletFromSeed(seedPhrase)
        .wallet.address(),
      assets,
    };
  };


test("emulator test",async() => {
    const policyid = "88dc7cd1c28d3a0c7ef4df99036c7c9688d309d91a1bb6fe4b08fee9";
    const myToken = fromText ("myToken");
    const unit = policyid + myToken;
    const user1 = await generateAccountSeedPhrase({lovelace : 5_000_000n});
    const user2 = await generateAccountSeedPhrase({lovelace : 10_000_000n,[unit]:70n});
    const emulator = new Emulator ([user1,user2]);
    const lucid = await Lucid.new(emulator);

    lucid.selectWalletFromSeed (user1.seedPhrase);
    console.log ("user1 utxos",await lucid.wallet.getUtxos());

    lucid.selectWalletFromSeed (user2.seedPhrase);
    console.log ("user2 utxos",await lucid.wallet.getUtxos());

    //emulator.awaitBlock(10);

    const tx= await lucid.newTx().payToAddress(user1.address, {lovelace : 1_000_000n}).complete();
    const signedTx = await tx.sign().complete();
    const txhash = await signedTx.submit();

    console.log (txhash);

    emulator.awaitBlock(10);

    lucid.selectWalletFromSeed(user1.seedPhrase);
    console.log ("user1 utxos",await lucid.wallet.getUtxos());
  
    const marketplace : Script = { 
      type: "PlutusV2",
      script: script.cborHex,
    };
    
    const matchingNumberAddress = lucid.utils.validatorToAddress(marketplace);
});

  //1. Alice locks 1 NFT -> MarketPlace Contract
  //2. Bob fetch all utxos from MarketPlace contract
  //3. Bob picks 1 utxo
  //4. Build tx with
  //   - Collect the utxo
  //   - convert the raw datum to simpleSale schema
  //   - we get the price of the asset and the address "sellerAddress"
  //   - convert "sellerAddress" to sellerAddress as bech32
  //   - pay to Alice
  //   - attach market contract, attach the redeemer "PBuy"

  // const tx= await lucid.newTx().payToAddress(user1.address, {lovelace : 1_000_000n}).complete();
  //  const signedTx = await tx.sign().complete();
  //  const txhash = await signedTx.submit();

test("Alice sells NFT, Bob buys NFT", async () => {
  const alice = await generateAccountSeedPhrase ({lovelace : 5_000_000n});
  const bobby = await generateAccountSeedPhrase ({lovelace : 10_000_000n});
  const emulator = new Emulator([alice,bobby]);
  const lucid = Lucid.new(emulator);
  (await lucid).selectWalletFromSeed(alice.seedPhrase);
  (await lucid).selectWalletFromSeed(bobby.seedPhrase);
  const marketplace : Script = { 
    type: "PlutusV2",
    script: script.cborHex,
  };
  const marketplaceaddr = (await lucid).utils.validatorToAddress(marketplace);
  console.log(marketplaceaddr);
  const datum = Data.to({sellerAddress : fromAddress (alice.address),priceOfAsset : 5_000_000n},SimpleSale)
  console.log(datum);
  // Alice locks 1_000_000 lovelace at the script address
  const lockNFT =  (await lucid)
    .newTx()
    .payToContract(marketplaceaddr,datum,{lovelace : 1_000_000n})
    .complete();
  //console.log (lockNFT);
  const signedTx = (await lockNFT).sign().complete();
  const locktxhash =(await signedTx).submit();
  console.log (await locktxhash);

  emulator.awaitBlock(10);

  const bobpicksutxo = await (await lucid).utxosAt(marketplaceaddr);
  console.log(bobpicksutxo);
  const BuyRedeemer = Data.to("PBuy",MarketRedeemer);
  const WithdrawRedeemer = Data.to("PWithdraw",MarketRedeemer);

  const rawdatumCBOR =
  //"d8799fd8799fd8799f581cad2eac5b83ee132d92f33fefc9cfc265430db6fc4a001110c7407995ffd8799fd8799fd8799f581c09a3a2c68cc405fc5656a77eb89460a91f24a775c86ba8039ea70b75ffffffff1a004c4b40ff";
  "d8799fd8799fd8799f581cee52c61a6500b0b9bde593344465592b8a80858a171409e9361942e6ffd8799fd8799fd8799f581cd147ddfa0ec53d130c7190f619aff5f98d503948a011a519f3bb5a2affffffff1a004c4b40ff"
  const datumSample = Data.from(rawdatumCBOR, SimpleSale);
  const selleraddrSc = datumSample.sellerAddress;
  const selleraddrBech = toAddress(selleraddrSc,await lucid);

  const collectNft = (await lucid).newTx().collectFrom(bobpicksutxo,BuyRedeemer).attachWithdrawalValidator(marketplace)
                     .payToAddress(selleraddrBech,{lovelace: 6_000_000n});
  
  emulator.awaitBlock(10);
  (await lucid).selectWalletFromSeed(alice.seedPhrase);
  console.log ("Alice balance:",await (await lucid).wallet.getUtxos());
  (await lucid).selectWalletFromSeed(bobby.seedPhrase);
  console.log ("bobby balance:",await (await lucid).wallet.getUtxos());
  

});