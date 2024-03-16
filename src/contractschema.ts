import {
    Address,
    Data,
    getAddressDetails,
  } from "@anastasia-labs/lucid-cardano-fork";
  
import { AddressSchema } from "./Utils.js";
  // data PMarketRedeemer (s :: S)
  //   = PBuy (Term s (PDataRecord '[]))
  //   | PWithdraw (Term s (PDataRecord '[]))
  
  // data PSimpleSale (s :: S)
  //   = PSimpleSale
  //       ( Term
  //           s
  //           ( PDataRecord
  //               '[ "sellerAddress" ':= PAddress
  //                , "priceOfAsset" ':= PInteger
  //                ]
  //           )
  //       )
  
  // unknown -> schema -> true | false
  
  const SimpleSaleSchema = Data.Object({
    sellerAddress: AddressSchema,
    priceOfAsset: Data.Integer(),
  });

  export type SimpleSale = Data.Static<typeof SimpleSaleSchema>;
  export const SimpleSale = SimpleSaleSchema as unknown as SimpleSale;

  console.log (SimpleSaleSchema);
  
  //data PMarketRedeemer (s :: S)
  //   = PBuy (Term s (PDataRecord '[]))
  //   | PWithdraw (Term s (PDataRecord '[]))

 const MarketRedeemerSchema = Data.Enum ([
    Data.Literal ("PBuy"),
    Data.Literal ("PWithdraw")
 ]);
 
 export type MarketRedeemer = Data.Static<typeof MarketRedeemerSchema>;
 export const MarketRedeemer = MarketRedeemerSchema as unknown as MarketRedeemer;

 console.log (MarketRedeemerSchema);
 



  