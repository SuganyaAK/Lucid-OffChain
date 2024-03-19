

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
  const policyid = "07228dfb8c387a58df42870908f22bd97c8fbe07cae9776a63be2105";
  const myToken = fromText ("myNFTToken");
  const unit = policyid + myToken;

  const alice = await generateAccountSeedPhrase ({lovelace : 10_000_000n});
  const bobby = await generateAccountSeedPhrase ({lovelace : 20_000_000n,[unit]:1n});
  //const charles = await generateAccountSeedPhrase ({lovelace : 20_000_000n});

  const emulator = new Emulator([alice,bobby]);
  const lucid = Lucid.new(emulator);
  (await lucid).selectWalletFromSeed(alice.seedPhrase);
  console.log("Alice wallet before transfer:",await (await lucid).wallet.getUtxos());
  (await lucid).selectWalletFromSeed(bobby.seedPhrase);
  console.log("Bobby wallet before transfer:",await (await lucid).wallet.getUtxos());
  emulator.awaitBlock(10);

  const marketplace : Script = { 
    type: "PlutusV2",
    script: script.cborHex,
  };
  const marketplaceaddr = (await lucid).utils.validatorToAddress(marketplace);
  console.log("Marketplace Address:",marketplaceaddr);
  const datum = Data.to({sellerAddress : fromAddress (alice.address),priceOfAsset : 5_000_000n},SimpleSale)
  console.log("Simplesale datum:",datum);
  // Alice locks 1_000_000 lovelace at the script address

  emulator.awaitBlock(10);
  const lockNFT =  (await lucid)
    .newTx()
    .payToContract(marketplaceaddr,datum,{[unit] : 1n})
    .complete();
  const signedTx = (await lockNFT).sign().complete();
  const locktxhash =(await signedTx).submit();

  console.log ("Txn hash:",await locktxhash);

  emulator.awaitBlock(10);
  const datumSample = Data.from(datum, SimpleSale);
  const selleraddrSc = datumSample.sellerAddress;
  const priceAsset = datumSample.priceOfAsset;
  const selleraddrBech = toAddress(selleraddrSc,await lucid);
  const BuyRedeemer = Data.to("PBuy",MarketRedeemer);
  const WithdrawRedeemer = Data.to("PWithdraw",MarketRedeemer);

  const bobpicksutxo = await (await lucid).utxosAt(marketplaceaddr);
  console.log("UTxo at contract addr;",bobpicksutxo);
  const collectNft = (await lucid).newTx().collectFrom(bobpicksutxo,BuyRedeemer)
                     .attachSpendingValidator(marketplace)
                     .payToAddress(alice.address,{lovelace :priceAsset})
                     .complete();

  const signedcollectTx = (await collectNft).sign().complete();
  const collecttxhash =(await signedcollectTx).submit();
  
  emulator.awaitBlock(10);

  (await lucid).selectWalletFromSeed(alice.seedPhrase);
  console.log ("Alice balance:",await (await lucid).wallet.getUtxos());
  (await lucid).selectWalletFromSeed(bobby.seedPhrase);
  console.log ("bobby balance:",await (await lucid).wallet.getUtxos());
});

// Withdraw NFT

test("Alice sells NFT, Bob withdraws NFT", async () => {
  const policyid = "07228dfb8c387a58df42870908f22bd97c8fbe07cae9776a63be2105";
  const myToken = fromText ("myNFTToken");
  const unit = policyid + myToken;

  const alice = await generateAccountSeedPhrase ({lovelace : 10_000_000n});
  const bobby = await generateAccountSeedPhrase ({lovelace : 20_000_000n,[unit]:1n});
  //const charles = await generateAccountSeedPhrase ({lovelace : 20_000_000n});

  const emulator = new Emulator([alice,bobby]);
  const lucid = Lucid.new(emulator);
  (await lucid).selectWalletFromSeed(alice.seedPhrase);
  console.log("Alice wallet before transfer:",await (await lucid).wallet.getUtxos());
  (await lucid).selectWalletFromSeed(bobby.seedPhrase);
  console.log("Bobby wallet before transfer:",await (await lucid).wallet.getUtxos());
  emulator.awaitBlock(10);

  const marketplace : Script = { 
    type: "PlutusV2",
    script: script.cborHex,
  };
  const marketplaceaddr = (await lucid).utils.validatorToAddress(marketplace);
  console.log("Marketplace Address:",marketplaceaddr);
  const datum = Data.to({sellerAddress : fromAddress (alice.address),priceOfAsset : 5_000_000n},SimpleSale)
  console.log("Simplesale datum:",datum);
  // Alice locks 1_000_000 lovelace at the script address

  emulator.awaitBlock(10);
  const lockNFT =  (await lucid)
    .newTx()
    .payToContract(marketplaceaddr,datum,{[unit] : 1n})
    .complete();
  const signedTx = (await lockNFT).sign().complete();
  const locktxhash =(await signedTx).submit();

  console.log ("Txn hash:",await locktxhash);

  emulator.awaitBlock(10);

  const datumSample = Data.from(datum, SimpleSale);
  const selleraddrSc = datumSample.sellerAddress;
  const selleraddrBech = toAddress(selleraddrSc,await lucid);
  const WithdrawRedeemer = Data.to("PWithdraw",MarketRedeemer);

  const bobpicksutxo = (await lucid).utxosAtWithUnit(marketplaceaddr,unit);
  //await (await lucid).(marketplaceaddr);
  console.log("UTxo at contract addr;",bobpicksutxo);

  const tx = (await lucid).newTx()
                     .collectFrom(await bobpicksutxo,WithdrawRedeemer)
                     .attachSpendingValidator(marketplace)
                     .addSigner(alice.address)
                     .complete();
  console.log ("withdrawnft:",await tx);
  const signedwithdrawTx = await (await tx).sign().complete();
  const txhash = signedwithdrawTx.submit();

  emulator.awaitBlock(10);

 // (await lucid).selectWalletFromSeed(alice.seedPhrase);
 // console.log ("Alice balance:",await (await lucid).wallet.getUtxos());
 // (await lucid).selectWalletFromSeed(bobby.seedPhrase);
 // console.log ("bobby balance:",await (await lucid).wallet.getUtxos());
});



