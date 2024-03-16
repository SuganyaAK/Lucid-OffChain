import { Address, Data, Lucid, getAddressDetails } from "@anastasia-labs/lucid-cardano-fork";

export const CredentialSchema = Data.Enum([
    Data.Object({
      PublicKeyCredential: Data.Tuple([
        Data.Bytes({ minLength: 28, maxLength: 28 }),
      ]),
    }),
    Data.Object({
      ScriptCredential: Data.Tuple([
        Data.Bytes({ minLength: 28, maxLength: 28 }),
      ]),
    }),
  ]);
  export type CredentialD = Data.Static<typeof CredentialSchema>;
  export const CredentialD = CredentialSchema as unknown as CredentialD;
  
  export const AddressSchema = Data.Object({
    paymentCredential: CredentialSchema,
    stakeCredential: Data.Nullable(
      Data.Enum([
        Data.Object({ Inline: Data.Tuple([CredentialSchema]) }),
        Data.Object({
          Pointer: Data.Tuple([
            Data.Object({
              slotNumber: Data.Integer(),
              transactionIndex: Data.Integer(),
              certificateIndex: Data.Integer(),
            }),
          ]),
        }),
      ])
    ),
  });
  export type AddressD = Data.Static<typeof AddressSchema>;
  export const AddressD = AddressSchema as unknown as AddressD;
  
  export function fromAddress(address: Address): AddressD {
    // We do not support pointer addresses!
  
    const { paymentCredential, stakeCredential } = getAddressDetails(address);
  
    if (!paymentCredential) throw new Error("Not a valid payment address.");
  
    return {
      paymentCredential:
        paymentCredential?.type === "Key"
          ? {
              PublicKeyCredential: [paymentCredential.hash],
            }
          : { ScriptCredential: [paymentCredential.hash] },
      stakeCredential: stakeCredential
        ? {
            Inline: [
              stakeCredential.type === "Key"
                ? {
                    PublicKeyCredential: [stakeCredential.hash],
                  }
                : { ScriptCredential: [stakeCredential.hash] },
            ],
          }
        : null,
    };
  }

  export function toAddress(address: AddressD, lucid: Lucid): Address {
    const paymentCredential = (() => {
      if ("PublicKeyCredential" in address.paymentCredential) {
        return lucid.utils.keyHashToCredential(
          address.paymentCredential.PublicKeyCredential[0]
        );
      } else {
        return lucid.utils.scriptHashToCredential(
          address.paymentCredential.ScriptCredential[0]
        );
      }
    })();
    const stakeCredential = (() => {
      if (!address.stakeCredential) return undefined;
      if ("Inline" in address.stakeCredential) {
        if ("PublicKeyCredential" in address.stakeCredential.Inline[0]) {
          return lucid.utils.keyHashToCredential(
            address.stakeCredential.Inline[0].PublicKeyCredential[0]
          );
        } else {
          return lucid.utils.scriptHashToCredential(
            address.stakeCredential.Inline[0].ScriptCredential[0]
          );
        }
      } else {
        return undefined;
      }
    })();
    return lucid.utils.credentialToAddress(paymentCredential, stakeCredential);
  }
  