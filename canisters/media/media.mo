import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
persistent actor {
  type Address = Text;
  type MediaId = Text;
  type ChatId = Text;
  type Message = {
    sender : Address;
    sentAt : Nat64;
    text : Text
  };

  stable var avatars : [(Address, Blob)] = [];
  stable var videos : [(MediaId, Blob)] = [];
  type VideoMeta = {
    challengeId : Text;
    uploader : Address;
    uploadedAt : Nat64;
    durationSec : Nat
  };
  stable var videoMeta : [(MediaId, VideoMeta)] = [];
  stable var uploadSessions : [(MediaId, {
    challengeId : Text;
    uploader : Address;
    durationSec : Nat;
    startedAt : Nat64;
    finalized : Bool;
    totalSize : Nat;
    chunks : [[Nat8]]
  })] = [];
  stable var chats : [(ChatId, [Address])] = [];
  stable var chatMessages : [(ChatId, [Message])] = [];

  public func setAvatar(addr : Address, data : Blob) : async Bool {
    var found = false;
    avatars := Array.map<(Address, Blob), (Address, Blob)>(avatars, func(p) {
      if (p.0 == addr) { found := true; (addr, data) } else p
    });
    if (not found) { avatars := Array.append<(Address, Blob)>(avatars, [(addr, data)]) };
    true
  };

  public query func getAvatar(addr : Address) : async ?Blob {
    for ((a, d) in avatars.vals()) { if (a == addr) { return ?d } };
    null
  };

  public func addDisputeVideo(challengeId : Text, mediaId : MediaId, data : Blob, uploader : Address, durationSec : Nat) : async Bool {
    if (durationSec > 180) { return false };
    if (Array.size(Blob.toArray(data)) > (70 * 1024 * 1024)) { return false };
    videos := Array.append<(MediaId, Blob)>(videos, [(mediaId, data)]);
    videoMeta := Array.append<(MediaId, VideoMeta)>(videoMeta, [(
      mediaId,
      {
        challengeId = challengeId;
        uploader = uploader;
        uploadedAt = Nat64.fromIntWrap(Time.now());
        durationSec = durationSec
      }
    )]);
    true
  };

  public func startUpload(challengeId : Text, mediaId : MediaId, uploader : Address, durationSec : Nat) : async Bool {
    if (durationSec > 180) { return false };
    for ((m, _) in uploadSessions.vals()) { if (m == mediaId) { return false } };
    uploadSessions := Array.append<(MediaId, {
      challengeId : Text; uploader : Address; durationSec : Nat; startedAt : Nat64; finalized : Bool; totalSize : Nat; chunks : [[Nat8]]
    })>(uploadSessions, [(
      mediaId,
      {
        challengeId = challengeId;
        uploader = uploader;
        durationSec = durationSec;
        startedAt = Nat64.fromIntWrap(Time.now());
        finalized = false;
        totalSize = 0;
        chunks = []
      }
    )]);
    true
  };

  public func appendChunk(mediaId : MediaId, chunk : [Nat8]) : async Bool {
    var updated : [(MediaId, {
      challengeId : Text; uploader : Address; durationSec : Nat; startedAt : Nat64; finalized : Bool; totalSize : Nat; chunks : [[Nat8]]
    })] = [];
    var found = false;
    for ((m, s) in uploadSessions.vals()) {
      if (m == mediaId) {
        if (s.finalized) { return false };
        let newSize = s.totalSize + chunk.size();
        if (newSize > (70 * 1024 * 1024)) { return false };
        let newChunks = Array.append<[Nat8]>(s.chunks, [chunk]);
        updated := Array.append<(MediaId, {
          challengeId : Text; uploader : Address; durationSec : Nat; startedAt : Nat64; finalized : Bool; totalSize : Nat; chunks : [[Nat8]]
        })>(updated, [(m, {
          challengeId = s.challengeId; uploader = s.uploader; durationSec = s.durationSec; startedAt = s.startedAt; finalized = false; totalSize = newSize; chunks = newChunks
        })]);
        found := true;
      } else {
        updated := Array.append<(MediaId, {
          challengeId : Text; uploader : Address; durationSec : Nat; startedAt : Nat64; finalized : Bool; totalSize : Nat; chunks : [[Nat8]]
        })>(updated, [(m, s)]);
      }
    };
    if (not found) { return false };
    uploadSessions := updated;
    true
  };

  public func finalizeUpload(mediaId : MediaId) : async Bool {
    var newSessions : [(MediaId, {
      challengeId : Text; uploader : Address; durationSec : Nat; startedAt : Nat64; finalized : Bool; totalSize : Nat; chunks : [[Nat8]]
    })] = [];
    var finalizedBlob : ?Blob = null;
    var meta : ?(Text, Address, Nat64, Nat) = null;
    for ((m, s) in uploadSessions.vals()) {
      if (m == mediaId) {
        var total : [Nat8] = [];
        for (c in s.chunks.vals()) {
          total := Array.append<Nat8>(total, c)
        };
        finalizedBlob := ?Blob.fromArray(total);
        meta := ?(s.challengeId, s.uploader, s.startedAt, s.durationSec);
        newSessions := Array.append<(MediaId, {
          challengeId : Text; uploader : Address; durationSec : Nat; startedAt : Nat64; finalized : Bool; totalSize : Nat; chunks : [[Nat8]]
        })>(newSessions, [(m, {
          challengeId = s.challengeId; uploader = s.uploader; durationSec = s.durationSec; startedAt = s.startedAt; finalized = true; totalSize = s.totalSize; chunks = s.chunks
        })]);
      } else {
        newSessions := Array.append<(MediaId, {
          challengeId : Text; uploader : Address; durationSec : Nat; startedAt : Nat64; finalized : Bool; totalSize : Nat; chunks : [[Nat8]]
        })>(newSessions, [(m, s)]);
      }
    };
    uploadSessions := newSessions;
    switch (finalizedBlob, meta) {
      case (?(blob), ?(challengeId, uploader, startedAt, durationSec)) {
        videos := Array.append<(MediaId, Blob)>(videos, [(mediaId, blob)]);
        videoMeta := Array.append<(MediaId, VideoMeta)>(videoMeta, [(
          mediaId,
          {
            challengeId = challengeId;
            uploader = uploader;
            uploadedAt = startedAt;
            durationSec = durationSec
          }
        )]);
        true
      };
      case _ { false }
    }
  };

  public query func getDisputeVideo(mediaId : MediaId) : async ?Blob {
    for ((m, d) in videos.vals()) { if (m == mediaId) { return ?d } };
    null
  };

  public query func listDisputeVideos(challengeId : Text) : async [MediaId] {
    var ids : [MediaId] = [];
    for ((m, meta) in videoMeta.vals()) { if (meta.challengeId == challengeId) { ids := Array.append<MediaId>(ids, [m]) } };
    ids
  };
  public func createChat(room : ChatId, participants : [Address]) : async Bool {
    var exists = false;
    for ((r, _) in chats.vals()) { if (r == room) { exists := true } };
    if (exists) { return false };
    chats := Array.append<(ChatId, [Address])>(chats, [(room, participants)]);
    chatMessages := Array.append<(ChatId, [Message])>(chatMessages, [(room, [])]);
    true
  };

  public func postMessage(room : ChatId, sender : Address, text : Text) : async Bool {
    let msg : Message = { sender = sender; sentAt = Nat64.fromIntWrap(Time.now()); text = text };
    var updated : [(ChatId, [Message])] = [];
    var found = false;
    for ((r, ms) in chatMessages.vals()) {
      if (r == room) {
        updated := Array.append<(ChatId, [Message])>(updated, [(r, Array.append<Message>(ms, [msg]))]);
        found := true
      } else {
        updated := Array.append<(ChatId, [Message])>(updated, [(r, ms)])
      }
    };
    if (not found) { updated := Array.append<(ChatId, [Message])>(updated, [(room, [msg])]) };
    chatMessages := updated;
    true
  };

  public query func listMessages(room : ChatId) : async [Message] {
    for ((r, ms) in chatMessages.vals()) { if (r == room) { return ms } };
    []
  };
}
