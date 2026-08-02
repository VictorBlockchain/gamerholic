import { IDL } from '@dfinity/candid'

export const idlFactory = ({ IDL: I = IDL }: { IDL?: typeof IDL }) => {
  const Address = I.Text
  const MediaId = I.Text
  const Message = I.Record({ sender: Address, sentAt: I.Nat64, text: I.Text })
  return I.Service({
    setAvatar: I.Func([Address, I.Vec(I.Nat8)], [I.Bool], []),
    getAvatar: I.Func([Address], [I.Opt(I.Vec(I.Nat8))], ['query']),
    addDisputeVideo: I.Func([I.Text, MediaId, I.Vec(I.Nat8), Address, I.Nat], [I.Bool], []),
    startUpload: I.Func([I.Text, MediaId, Address, I.Nat], [I.Bool], []),
    appendChunk: I.Func([MediaId, I.Vec(I.Nat8)], [I.Bool], []),
    finalizeUpload: I.Func([MediaId], [I.Bool], []),
    getDisputeVideo: I.Func([MediaId], [I.Opt(I.Vec(I.Nat8))], ['query']),
    listDisputeVideos: I.Func([I.Text], [I.Vec(MediaId)], ['query']),
    createChat: I.Func([I.Text, I.Vec(Address)], [I.Bool], []),
    postMessage: I.Func([I.Text, Address, I.Text], [I.Bool], []),
    listMessages: I.Func([I.Text], [I.Vec(Message)], ['query']),
  })
}

export default idlFactory
