/**
 * Minimal Dexsta XFT + media IDL for portfolio reads (type-8 media / game assets).
 */
import { IDL } from "@dfinity/candid";

const XFTSettings = IDL.Record({
  linkedTo: IDL.Nat,
  xftType: IDL.Nat,
  quantity: IDL.Nat,
  transferable: IDL.Bool,
  labelExpire: IDL.Nat,
  wrapTo: IDL.Nat,
  unlockDate: IDL.Nat,
  licenseExpire: IDL.Nat,
  labelSplitBps: IDL.Nat,
  selfId: IDL.Nat,
  registrationYears: IDL.Nat,
  minterLicense: IDL.Nat,
  createDate: IDL.Nat,
  bumps: IDL.Nat,
  useLabelWallet: IDL.Nat,
});

const XFTAddresses = IDL.Record({
  creator: IDL.Principal,
  bag: IDL.Opt(IDL.Principal),
  linkedToken: IDL.Opt(IDL.Principal),
  mintingCanisterPrincipal: IDL.Opt(IDL.Principal),
});

const MediaRef = IDL.Record({
  src: IDL.Variant({ ICP: IDL.Nat, IPFS: IDL.Text }),
  mediaType: IDL.Text,
  sha256: IDL.Text,
});

const Token = IDL.Record({
  owner: IDL.Principal,
  uri: IDL.Text,
  bag: IDL.Opt(IDL.Principal),
});

export const dexstaXftIdl = IDL.Service({
  getUserXfts: IDL.Func(
    [IDL.Principal],
    [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
    ["query"],
  ),
  getUserGameAssetXfts: IDL.Func(
    [IDL.Principal],
    [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat))],
    ["query"],
  ),
  isGameAsset: IDL.Func([IDL.Nat], [IDL.Bool], ["query"]),
  /** Parent Lead Label id for this token (settings.linkedTo) */
  linkedLabelOf: IDL.Func([IDL.Nat], [IDL.Opt(IDL.Nat)], ["query"]),
  /** True if `user` is on the local operator list for this Lead Label id */
  isOperator: IDL.Func([IDL.Principal, IDL.Nat], [IDL.Bool], ["query"]),
  /** Resolve label display name by id */
  getLabelTextById: IDL.Func([IDL.Nat], [IDL.Opt(IDL.Text)], ["query"]),
  getXFT: IDL.Func(
    [IDL.Principal, IDL.Nat],
    [
      IDL.Record({
        settings: IDL.Opt(XFTSettings),
        addresses: IDL.Opt(XFTAddresses),
        media: IDL.Vec(IDL.Tuple(IDL.Text, MediaRef)),
        owner: IDL.Opt(IDL.Principal),
        token: IDL.Opt(Token),
        exists: IDL.Bool,
        contractValid: IDL.Bool,
        gameAsset: IDL.Bool,
      }),
    ],
    ["query"],
  ),
  getCardLight: IDL.Func(
    [IDL.Principal, IDL.Nat],
    [
      IDL.Record({
        exists: IDL.Bool,
        owner: IDL.Opt(IDL.Principal),
        xft_type: IDL.Nat,
        quantity: IDL.Nat,
        create_date: IDL.Nat,
        bag: IDL.Opt(IDL.Principal),
        uri: IDL.Text,
        linked_to: IDL.Nat,
        label_expire: IDL.Nat,
        license_expire: IDL.Nat,
        ticker: IDL.Text,
        label_name: IDL.Text,
        game_asset: IDL.Bool,
      }),
    ],
    ["query"],
  ),
});

const MediaAssetRecord = IDL.Record({
  id: IDL.Nat,
  tokenId: IDL.Nat,
  variant: IDL.Text,
  contractPrincipal: IDL.Principal,
  size: IDL.Nat,
  mediaType: IDL.Text,
  sha256: IDL.Text,
  createdAt: IDL.Nat,
  chunks: IDL.Vec(IDL.Vec(IDL.Nat8)),
});

export const dexstaMediaIdl = IDL.Service({
  getLatestByContractAndToken: IDL.Func(
    [IDL.Principal, IDL.Nat, IDL.Text],
    [IDL.Opt(MediaAssetRecord)],
    ["query"],
  ),
});
