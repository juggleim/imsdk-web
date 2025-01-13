/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import $protobuf from "../3rd/protobuf";

const $root = ($protobuf.roots["default"] || ($protobuf.roots["default"] = new $protobuf.Root()))
.addJSON({
  codec: {
    nested: {
      ConnectMsgBody: {
        fields: {
          protoId: {
            type: "string",
            id: 1
          },
          sdkVersion: {
            type: "string",
            id: 2
          },
          appkey: {
            type: "string",
            id: 3
          },
          token: {
            type: "string",
            id: 4
          },
          deviceId: {
            type: "string",
            id: 5
          },
          platform: {
            type: "string",
            id: 6
          },
          deviceCompany: {
            type: "string",
            id: 7
          },
          deviceModel: {
            type: "string",
            id: 8
          },
          deviceOsVersion: {
            type: "string",
            id: 9
          },
          pushToken: {
            type: "string",
            id: 10
          },
          networkId: {
            type: "string",
            id: 11
          },
          ispNum: {
            type: "string",
            id: 12
          },
          clientIp: {
            type: "string",
            id: 13
          },
          packageName: {
            type: "string",
            id: 14
          },
          pushChannel: {
            type: "string",
            id: 15
          },
          ext: {
            type: "string",
            id: 16
          },
          clientSession: {
            type: "string",
            id: 17
          }
        }
      },
      ConnectAckMsgBody: {
        fields: {
          code: {
            type: "int32",
            id: 1
          },
          userId: {
            type: "string",
            id: 2
          },
          session: {
            type: "string",
            id: 3
          },
          timestamp: {
            type: "int64",
            id: 4
          },
          ext: {
            type: "string",
            id: 5
          }
        }
      },
      DisconnectMsgBody: {
        fields: {
          code: {
            type: "int32",
            id: 1
          },
          timestamp: {
            type: "int64",
            id: 2
          },
          ext: {
            type: "string",
            id: 3
          }
        }
      },
      PublishMsgBody: {
        fields: {
          index: {
            type: "int32",
            id: 1
          },
          topic: {
            type: "string",
            id: 2
          },
          targetId: {
            type: "string",
            id: 3
          },
          timestamp: {
            type: "int64",
            id: 4
          },
          data: {
            type: "bytes",
            id: 5
          }
        }
      },
      PublishAckMsgBody: {
        fields: {
          index: {
            type: "int32",
            id: 1
          },
          code: {
            type: "int32",
            id: 2
          },
          msgId: {
            type: "string",
            id: 3
          },
          timestamp: {
            type: "int64",
            id: 4
          },
          msgIndex: {
            type: "int64",
            id: 5
          },
          memberCount: {
            type: "int32",
            id: 6
          }
        }
      },
      QueryMsgBody: {
        fields: {
          index: {
            type: "int32",
            id: 1
          },
          topic: {
            type: "string",
            id: 2
          },
          targetId: {
            type: "string",
            id: 3
          },
          timestamp: {
            type: "int64",
            id: 4
          },
          data: {
            type: "bytes",
            id: 5
          }
        }
      },
      QueryAckMsgBody: {
        fields: {
          index: {
            type: "int32",
            id: 1
          },
          code: {
            type: "int32",
            id: 2
          },
          timestamp: {
            type: "int64",
            id: 3
          },
          data: {
            type: "bytes",
            id: 4
          }
        }
      },
      QueryConfirmMsgBody: {
        fields: {
          index: {
            type: "int32",
            id: 1
          }
        }
      },
      ImWebsocketMsg: {
        oneofs: {
          testof: {
            oneof: [
              "connectMsgBody",
              "ConnectAckMsgBody",
              "disconnectMsgBody",
              "publishMsgBody",
              "pubAckMsgBody",
              "qryMsgBody",
              "qryAckMsgBody",
              "qryConfirmMsgBody"
            ]
          }
        },
        fields: {
          version: {
            type: "int32",
            id: 1
          },
          cmd: {
            type: "int32",
            id: 2
          },
          qos: {
            type: "int32",
            id: 3
          },
          payload: {
            type: "bytes",
            id: 4
          },
          connectMsgBody: {
            type: "ConnectMsgBody",
            id: 11
          },
          ConnectAckMsgBody: {
            type: "ConnectAckMsgBody",
            id: 12
          },
          disconnectMsgBody: {
            type: "DisconnectMsgBody",
            id: 13
          },
          publishMsgBody: {
            type: "PublishMsgBody",
            id: 14
          },
          pubAckMsgBody: {
            type: "PublishAckMsgBody",
            id: 15
          },
          qryMsgBody: {
            type: "QueryMsgBody",
            id: 16
          },
          qryAckMsgBody: {
            type: "QueryAckMsgBody",
            id: 17
          },
          qryConfirmMsgBody: {
            type: "QueryConfirmMsgBody",
            id: 18
          }
        }
      },
      ChannelType: {
        values: {
          Private: 1,
          Group: 2,
          Chatroom: 3,
          System: 4
        }
      },
      PushData: {
        fields: {
          title: {
            type: "string",
            id: 1
          },
          pushId: {
            type: "string",
            id: 2
          },
          pushText: {
            type: "string",
            id: 3
          },
          pushExtraData: {
            type: "string",
            id: 4
          }
        }
      },
      QryHisMsgsReq: {
        fields: {
          converId: {
            type: "string",
            id: 1
          },
          type: {
            type: "ChannelType",
            id: 2
          },
          startTime: {
            type: "int64",
            id: 3
          },
          count: {
            type: "int32",
            id: 4
          },
          order: {
            type: "int32",
            id: 5
          },
          msgTypes: {
            rule: "repeated",
            type: "string",
            id: 6
          }
        }
      },
      DownMsgSet: {
        fields: {
          msgs: {
            rule: "repeated",
            type: "DownMsg",
            id: 1
          },
          syncTime: {
            type: "int64",
            id: 2
          },
          isFinished: {
            type: "bool",
            id: 3
          },
          targetUserInfo: {
            type: "UserInfo",
            id: 4
          },
          groupInfo: {
            type: "GroupInfo",
            id: 5
          }
        }
      },
      UpMsg: {
        fields: {
          msgType: {
            type: "string",
            id: 1
          },
          msgContent: {
            type: "bytes",
            id: 2
          },
          flags: {
            type: "int32",
            id: 3
          },
          clientUid: {
            type: "string",
            id: 4
          },
          pushData: {
            type: "PushData",
            id: 5
          },
          mentionInfo: {
            type: "MentionInfo",
            id: 6
          },
          referMsg: {
            type: "DownMsg",
            id: 7
          },
          toUserIds: {
            rule: "repeated",
            type: "string",
            id: 8
          },
          mergedMsgs: {
            type: "MergedMsgs",
            id: 9
          }
        }
      },
      MentionInfo: {
        fields: {
          mentionType: {
            type: "MentionType",
            id: 1
          },
          targetUsers: {
            rule: "repeated",
            type: "UserInfo",
            id: 2
          }
        }
      },
      MentionType: {
        values: {
          MentionDefault: 0,
          MentionAll: 1,
          MentionSomeone: 2
        }
      },
      DownMsg: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          type: {
            type: "ChannelType",
            id: 2
          },
          msgType: {
            type: "string",
            id: 3
          },
          senderId: {
            type: "string",
            id: 4
          },
          msgId: {
            type: "string",
            id: 5
          },
          msgIndex: {
            type: "int64",
            id: 6
          },
          msgContent: {
            type: "bytes",
            id: 7
          },
          msgTime: {
            type: "int64",
            id: 8
          },
          flags: {
            type: "int32",
            id: 9
          },
          isSend: {
            type: "bool",
            id: 10
          },
          platform: {
            type: "string",
            id: 11
          },
          clientUid: {
            type: "string",
            id: 12
          },
          pushData: {
            type: "PushData",
            id: 13
          },
          mentionInfo: {
            type: "MentionInfo",
            id: 14
          },
          isRead: {
            type: "bool",
            id: 15
          },
          referMsg: {
            type: "DownMsg",
            id: 16
          },
          targetUserInfo: {
            type: "UserInfo",
            id: 17
          },
          groupInfo: {
            type: "GroupInfo",
            id: 18
          },
          mergedMsgs: {
            type: "MergedMsgs",
            id: 19
          },
          undisturbType: {
            type: "int32",
            id: 20
          },
          memberCount: {
            type: "int32",
            id: 21
          },
          readCount: {
            type: "int32",
            id: 22
          },
          unreadIndex: {
            type: "int64",
            id: 23
          },
          msgItems: {
            rule: "repeated",
            type: "StreamMsgItem",
            id: 24
          },
          msgExtSet: {
            rule: "repeated",
            type: "MsgExtItem",
            id: 25
          },
          msgExts: {
            rule: "repeated",
            type: "MsgExtItem",
            id: 26
          },
          converTags: {
            rule: "repeated",
            type: "ConverTag",
            id: 27
          }
        }
      },
      StreamMsgItem: {
        fields: {
          event: {
            type: "StreamEvent",
            id: 1
          },
          subSeq: {
            type: "int64",
            id: 2
          },
          partialContent: {
            type: "bytes",
            id: 3
          }
        }
      },
      StreamDownMsg: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          msgId: {
            type: "string",
            id: 3
          },
          msgItems: {
            rule: "repeated",
            type: "StreamMsgItem",
            id: 4
          }
        }
      },
      StreamEvent: {
        values: {
          DefaultStreamEvent: 0,
          StreamMessage: 1,
          StreamComplete: 2
        }
      },
      MergedMsgs: {
        fields: {
          channelType: {
            type: "ChannelType",
            id: 1
          },
          userId: {
            type: "string",
            id: 2
          },
          targetId: {
            type: "string",
            id: 3
          },
          msgs: {
            rule: "repeated",
            type: "SimpleMsg",
            id: 4
          }
        }
      },
      GroupInfo: {
        fields: {
          groupId: {
            type: "string",
            id: 1
          },
          groupName: {
            type: "string",
            id: 2
          },
          groupPortrait: {
            type: "string",
            id: 3
          },
          isMute: {
            type: "int32",
            id: 4
          },
          extFields: {
            rule: "repeated",
            type: "KvItem",
            id: 5
          },
          updatedTime: {
            type: "int64",
            id: 6
          }
        }
      },
      KvItem: {
        fields: {
          key: {
            type: "string",
            id: 1
          },
          value: {
            type: "string",
            id: 2
          }
        }
      },
      UserIdReq: {
        fields: {
          userId: {
            type: "string",
            id: 1
          }
        }
      },
      UserInfo: {
        fields: {
          userId: {
            type: "string",
            id: 1
          },
          nickname: {
            type: "string",
            id: 2
          },
          userPortrait: {
            type: "string",
            id: 3
          },
          extFields: {
            rule: "repeated",
            type: "KvItem",
            id: 4
          },
          updatedTime: {
            type: "int64",
            id: 5
          },
          settings: {
            rule: "repeated",
            type: "KvItem",
            id: 6
          },
          statuses: {
            rule: "repeated",
            type: "KvItem",
            id: 7
          },
          userType: {
            type: "UserType",
            id: 8
          }
        }
      },
      UserType: {
        values: {
          User: 0,
          Bot: 1
        }
      },
      SyncConversationsReq: {
        fields: {
          startTime: {
            type: "int64",
            id: 1
          },
          count: {
            type: "int32",
            id: 2
          }
        }
      },
      QryConversationsReq: {
        fields: {
          startTime: {
            type: "int64",
            id: 1
          },
          count: {
            type: "int32",
            id: 2
          },
          order: {
            type: "int32",
            id: 3
          },
          targetId: {
            type: "string",
            id: 5
          },
          channelType: {
            type: "ChannelType",
            id: 6
          },
          tag: {
            type: "string",
            id: 7
          }
        }
      },
      QryConversationsResp: {
        fields: {
          conversations: {
            rule: "repeated",
            type: "Conversation",
            id: 1
          },
          isFinished: {
            type: "bool",
            id: 2
          }
        }
      },
      ClearUnreadReq: {
        fields: {
          conversations: {
            rule: "repeated",
            type: "Conversation",
            id: 1
          }
        }
      },
      DelConversationReq: {
        fields: {
          conversations: {
            rule: "repeated",
            type: "Conversation",
            id: 1
          }
        }
      },
      ConversationsReq: {
        fields: {
          conversations: {
            rule: "repeated",
            type: "Conversation",
            id: 1
          }
        }
      },
      Conversation: {
        fields: {
          userId: {
            type: "string",
            id: 1
          },
          targetId: {
            type: "string",
            id: 2
          },
          channelType: {
            type: "ChannelType",
            id: 3
          },
          sortTime: {
            type: "int64",
            id: 4
          },
          unreadCount: {
            type: "int64",
            id: 5
          },
          msg: {
            type: "DownMsg",
            id: 6
          },
          latestReadIndex: {
            type: "int64",
            id: 7
          },
          mentions: {
            type: "Mentions",
            id: 8
          },
          isTop: {
            type: "int32",
            id: 9
          },
          topUpdatedTime: {
            type: "int64",
            id: 10
          },
          undisturbType: {
            type: "int32",
            id: 11
          },
          targetUserInfo: {
            type: "UserInfo",
            id: 12
          },
          groupInfo: {
            type: "GroupInfo",
            id: 13
          },
          syncTime: {
            type: "int64",
            id: 14
          },
          isDelete: {
            type: "int32",
            id: 15
          },
          latestUnreadIndex: {
            type: "int64",
            id: 16
          },
          unreadTag: {
            type: "int32",
            id: 17
          },
          latestReadMsgId: {
            type: "string",
            id: 18
          },
          latestReadMsgTime: {
            type: "int64",
            id: 19
          },
          converTags: {
            rule: "repeated",
            type: "ConverTag",
            id: 20
          }
        }
      },
      Mentions: {
        fields: {
          isMentioned: {
            type: "bool",
            id: 1
          },
          mentionMsgCount: {
            type: "int32",
            id: 2
          },
          senders: {
            rule: "repeated",
            type: "UserInfo",
            id: 3
          },
          mentionMsgs: {
            rule: "repeated",
            type: "MentionMsg",
            id: 4
          }
        }
      },
      MentionMsg: {
        fields: {
          senderId: {
            type: "string",
            id: 1
          },
          msgId: {
            type: "string",
            id: 2
          },
          msgTime: {
            type: "int64",
            id: 3
          }
        }
      },
      SyncMsgReq: {
        fields: {
          syncTime: {
            type: "int64",
            id: 1
          },
          containsSendBox: {
            type: "bool",
            id: 2
          },
          sendBoxSyncTime: {
            type: "int64",
            id: 3
          },
          chatroomId: {
            type: "string",
            id: 4
          }
        }
      },
      SyncChatroomReq: {
        fields: {
          chatroomId: {
            type: "string",
            id: 1
          },
          syncTime: {
            type: "int64",
            id: 2
          },
          count: {
            type: "int32",
            id: 3
          }
        }
      },
      SyncChatroomMsgResp: {
        fields: {
          msgs: {
            rule: "repeated",
            type: "DownMsg",
            id: 1
          }
        }
      },
      Notify: {
        fields: {
          type: {
            type: "NotifyType",
            id: 1
          },
          syncTime: {
            type: "int64",
            id: 2
          },
          chatroomId: {
            type: "string",
            id: 3
          }
        }
      },
      NotifyType: {
        values: {
          Default: 0,
          Msg: 1,
          ChatroomMsg: 2,
          ChatroomAtt: 3,
          ChatroomEvent: 4,
          ChatroomDestroy: 5
        }
      },
      RecallMsgReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          msgId: {
            type: "string",
            id: 3
          },
          msgTime: {
            type: "int64",
            id: 4
          },
          exts: {
            rule: "repeated",
            type: "KvItem",
            id: 5
          }
        }
      },
      MarkReadReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          msgs: {
            rule: "repeated",
            type: "SimpleMsg",
            id: 3
          },
          indexScopes: {
            rule: "repeated",
            type: "IndexScope",
            id: 4
          }
        }
      },
      SimpleMsg: {
        fields: {
          msgId: {
            type: "string",
            id: 1
          },
          msgTime: {
            type: "int64",
            id: 2
          },
          msgIndex: {
            type: "int64",
            id: 3
          }
        }
      },
      IndexScope: {
        fields: {
          startIndex: {
            type: "int64",
            id: 1
          },
          endIndex: {
            type: "int64",
            id: 2
          }
        }
      },
      ModifyMsgReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          msgId: {
            type: "string",
            id: 3
          },
          msgTime: {
            type: "int64",
            id: 4
          },
          msgSeqNo: {
            type: "int64",
            id: 5
          },
          msgContent: {
            type: "bytes",
            id: 6
          }
        }
      },
      CleanHisMsgReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          cleanMsgTime: {
            type: "int64",
            id: 3
          }
        }
      },
      QryHisMsgByIdsReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          msgIds: {
            rule: "repeated",
            type: "string",
            id: 3
          }
        }
      },
      ChatRoomReq: {
        fields: {
          chatId: {
            type: "string",
            id: 1
          },
          chatName: {
            type: "string",
            id: 2
          },
          isAutoCreate: {
            type: "bool",
            id: 3
          }
        }
      },
      QryTotalUnreadCountReq: {
        fields: {
          time: {
            type: "int64",
            id: 1
          },
          filter: {
            type: "ConverFilter",
            id: 2
          }
        }
      },
      ConverFilter: {
        fields: {
          channelTypes: {
            rule: "repeated",
            type: "ChannelType",
            id: 1
          },
          ignoreConvers: {
            rule: "repeated",
            type: "SimpleConversation",
            id: 2
          },
          tag: {
            type: "string",
            id: 4
          }
        }
      },
      SimpleConversation: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          }
        }
      },
      QryTotalUnreadCountResp: {
        fields: {
          totalCount: {
            type: "int64",
            id: 1
          }
        }
      },
      QryMentionMsgsReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          startIndex: {
            type: "int64",
            id: 3
          },
          count: {
            type: "int32",
            id: 4
          },
          order: {
            type: "int32",
            id: 5
          },
          latestReadIndex: {
            type: "int64",
            id: 6
          }
        }
      },
      QryMentionMsgsResp: {
        fields: {
          mentionMsgs: {
            rule: "repeated",
            type: "DownMsg",
            id: 1
          },
          isFinished: {
            type: "bool",
            id: 2
          }
        }
      },
      QMentionMsg: {
        fields: {
          mentionType: {
            type: "MentionType",
            id: 1
          },
          senderInfo: {
            type: "UserInfo",
            id: 2
          },
          msg: {
            type: "DownMsg",
            id: 3
          }
        }
      },
      QryUploadTokenResp: {
        oneofs: {
          ossOf: {
            oneof: [
              "qiniuCred",
              "preSignResp"
            ]
          }
        },
        fields: {
          ossType: {
            type: "OssType",
            id: 1
          },
          qiniuCred: {
            type: "QiniuCredResp",
            id: 11
          },
          preSignResp: {
            type: "PreSignResp",
            id: 12
          }
        }
      },
      PreSignResp: {
        fields: {
          url: {
            type: "string",
            id: 1
          }
        }
      },
      OssType: {
        values: {
          DefaultOss: 0,
          QiNiu: 1,
          S3: 2,
          Minio: 3,
          Oss: 4
        }
      },
      QiniuCredResp: {
        fields: {
          domain: {
            type: "string",
            id: 1
          },
          token: {
            type: "string",
            id: 2
          }
        }
      },
      QryUploadTokenReq: {
        fields: {
          fileType: {
            type: "FileType",
            id: 1
          },
          ext: {
            type: "string",
            id: 2
          }
        }
      },
      FileType: {
        values: {
          DefaultFileType: 0,
          Image: 1,
          Audio: 2,
          Video: 3,
          File: 4
        }
      },
      QryReadDetailReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          msgId: {
            type: "string",
            id: 3
          }
        }
      },
      QryReadDetailResp: {
        fields: {
          readCount: {
            type: "int32",
            id: 1
          },
          memberCount: {
            type: "int32",
            id: 2
          },
          readMembers: {
            rule: "repeated",
            type: "MemberReadDetailItem",
            id: 3
          },
          unreadMembers: {
            rule: "repeated",
            type: "MemberReadDetailItem",
            id: 4
          }
        }
      },
      MemberReadDetailItem: {
        fields: {
          member: {
            type: "UserInfo",
            id: 1
          },
          time: {
            type: "int64",
            id: 2
          }
        }
      },
      QryMergedMsgsReq: {
        fields: {
          startTime: {
            type: "int64",
            id: 1
          },
          count: {
            type: "int32",
            id: 2
          },
          order: {
            type: "int32",
            id: 3
          }
        }
      },
      UndisturbConversReq: {
        fields: {
          userId: {
            type: "string",
            id: 1
          },
          items: {
            rule: "repeated",
            type: "UndisturbConverItem",
            id: 2
          }
        }
      },
      UndisturbConverItem: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          undisturbType: {
            type: "int32",
            id: 3
          }
        }
      },
      QryTopConversReq: {
        fields: {
          startTime: {
            type: "int64",
            id: 1
          }
        }
      },
      DelHisMsgsReq: {
        fields: {
          senderId: {
            type: "string",
            id: 1
          },
          targetId: {
            type: "string",
            id: 2
          },
          channelType: {
            type: "ChannelType",
            id: 3
          },
          msgs: {
            rule: "repeated",
            type: "SimpleMsg",
            id: 4
          }
        }
      },
      QryConverReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          }
        }
      },
      SyncChatroomAttResp: {
        fields: {
          atts: {
            rule: "repeated",
            type: "ChatAttItem",
            id: 1
          }
        }
      },
      ChatAtts: {
        fields: {
          chatId: {
            type: "string",
            id: 1
          },
          atts: {
            rule: "repeated",
            type: "ChatAttItem",
            id: 2
          },
          isComplete: {
            type: "bool",
            id: 3
          },
          isFinished: {
            type: "bool",
            id: 4
          }
        }
      },
      ChatAttItem: {
        fields: {
          key: {
            type: "string",
            id: 1
          },
          value: {
            type: "string",
            id: 2
          },
          attTime: {
            type: "int64",
            id: 3
          },
          userId: {
            type: "string",
            id: 4
          },
          optType: {
            type: "ChatAttOptType",
            id: 5
          }
        }
      },
      ChatAttOptType: {
        values: {
          ChatAttOpt_Default: 0,
          ChatAttOpt_Add: 1,
          ChatAttOpt_Del: 2
        }
      },
      UserUndisturb: {
        fields: {
          "switch": {
            type: "bool",
            id: 1
          },
          timezone: {
            type: "string",
            id: 2
          },
          rules: {
            rule: "repeated",
            type: "UserUndisturbItem",
            id: 3
          }
        }
      },
      UserUndisturbItem: {
        fields: {
          start: {
            type: "string",
            id: 1
          },
          end: {
            type: "string",
            id: 2
          }
        }
      },
      Nil: {
        fields: {}
      },
      ChatAttBatchReq: {
        fields: {
          atts: {
            rule: "repeated",
            type: "ChatAttReq",
            id: 1
          }
        }
      },
      ChatAttBatchResp: {
        fields: {
          attResps: {
            rule: "repeated",
            type: "ChatAttResp",
            id: 1
          }
        }
      },
      ChatAttReq: {
        fields: {
          key: {
            type: "string",
            id: 1
          },
          value: {
            type: "string",
            id: 2
          },
          isForce: {
            type: "bool",
            id: 3
          },
          isAutoDel: {
            type: "bool",
            id: 4
          },
          msg: {
            type: "UpMsg",
            id: 5
          }
        }
      },
      ChatAttResp: {
        fields: {
          key: {
            type: "string",
            id: 1
          },
          code: {
            type: "int32",
            id: 2
          },
          attTime: {
            type: "int64",
            id: 3
          },
          msgCode: {
            type: "int32",
            id: 11
          },
          msgId: {
            type: "string",
            id: 12
          },
          msgTime: {
            type: "int64",
            id: 13
          },
          msgSeq: {
            type: "int64",
            id: 14
          }
        }
      },
      QryFirstUnreadMsgReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          }
        }
      },
      ChrmEvent: {
        fields: {
          eventType: {
            type: "ChrmEventType",
            id: 1
          },
          chatId: {
            type: "string",
            id: 2
          },
          userId: {
            type: "string",
            id: 3
          },
          eventTime: {
            type: "int64",
            id: 4
          }
        }
      },
      ChrmEventType: {
        values: {
          Join: 0,
          Quit: 1,
          Kick: 2,
          Fallout: 3
        }
      },
      MsgExt: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          msgId: {
            type: "string",
            id: 3
          },
          ext: {
            type: "MsgExtItem",
            id: 4
          }
        }
      },
      MsgExtItem: {
        fields: {
          key: {
            type: "string",
            id: 1
          },
          value: {
            type: "string",
            id: 2
          },
          timestamp: {
            type: "int64",
            id: 3
          }
        }
      },
      TagConvers: {
        fields: {
          tag: {
            type: "string",
            id: 1
          },
          tagName: {
            type: "string",
            id: 2
          },
          convers: {
            rule: "repeated",
            type: "SimpleConversation",
            id: 11
          }
        }
      },
      UserConverTags: {
        fields: {
          tags: {
            rule: "repeated",
            type: "ConverTag",
            id: 1
          }
        }
      },
      ConverTag: {
        fields: {
          tag: {
            type: "string",
            id: 1
          },
          tagName: {
            type: "string",
            id: 2
          },
          tagType: {
            type: "ConverTagType",
            id: 3
          }
        }
      },
      ConverTagType: {
        values: {
          UserTag: 0,
          SystemTag: 1,
          GlobalTag: 2
        }
      },
      RtcRoomReq: {
        fields: {
          roomType: {
            type: "RtcRoomType",
            id: 1
          },
          roomId: {
            type: "string",
            id: 2
          },
          joinMember: {
            type: "RtcMember",
            id: 3
          }
        }
      },
      RtcRoomType: {
        values: {
          OneOne: 0,
          OneMore: 1
        }
      },
      RtcMember: {
        fields: {
          member: {
            type: "UserInfo",
            id: 1
          },
          rtcState: {
            type: "RtcState",
            id: 2
          },
          callTime: {
            type: "int64",
            id: 3
          },
          connectTime: {
            type: "int64",
            id: 4
          },
          hangupTime: {
            type: "int64",
            id: 5
          },
          inviter: {
            type: "UserInfo",
            id: 6
          }
        }
      },
      RtcState: {
        values: {
          RtcStateDefault: 0,
          RtcIncoming: 1,
          RtcOutgoing: 2,
          RtcConnecting: 3,
          RtcConnected: 4
        }
      },
      RtcRoom: {
        fields: {
          roomType: {
            type: "RtcRoomType",
            id: 1
          },
          roomId: {
            type: "string",
            id: 2
          },
          owner: {
            type: "UserInfo",
            id: 3
          },
          members: {
            rule: "repeated",
            type: "RtcMember",
            id: 51
          }
        }
      },
      RtcInviteReq: {
        fields: {
          targetIds: {
            rule: "repeated",
            type: "string",
            id: 1
          },
          roomType: {
            type: "RtcRoomType",
            id: 2
          },
          roomId: {
            type: "string",
            id: 3
          },
          rtcChannel: {
            type: "RtcChannel",
            id: 4
          },
          rtcMediaType: {
            type: "RtcMediaType",
            id: 5
          }
        }
      },
      RtcMediaType: {
        values: {
          RtcAudio: 0,
          RtcVideo: 1
        }
      },
      InviteType: {
        values: {
          RtcInvite: 0,
          RtcAccept: 1,
          RtcHangup: 2
        }
      },
      RtcInviteEvent: {
        fields: {
          inviteType: {
            type: "InviteType",
            id: 1
          },
          user: {
            type: "UserInfo",
            id: 2
          },
          room: {
            type: "RtcRoom",
            id: 3
          },
          targetUsers: {
            rule: "repeated",
            type: "UserInfo",
            id: 4
          }
        }
      },
      RtcAnswerReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          roomId: {
            type: "string",
            id: 2
          }
        }
      },
      RtcChannel: {
        values: {
          Zego: 0
        }
      },
      RtcAuth: {
        fields: {
          zegoAuth: {
            type: "ZegoAuth",
            id: 1
          }
        }
      },
      ZegoAuth: {
        fields: {
          token: {
            type: "string",
            id: 1
          }
        }
      },
      RtcRoomEvent: {
        fields: {
          roomEventType: {
            type: "RtcRoomEventType",
            id: 1
          },
          members: {
            rule: "repeated",
            type: "RtcMember",
            id: 2
          },
          room: {
            type: "RtcRoom",
            id: 3
          },
          reason: {
            type: "RtcRoomQuitReason",
            id: 4
          },
          eventTime: {
            type: "int64",
            id: 5
          }
        }
      },
      RtcRoomEventType: {
        values: {
          DefaultRtcRoomEvent: 0,
          RtcJoin: 1,
          RtcQuit: 2,
          RtcDestroy: 3,
          RtcStateChg: 4
        }
      },
      RtcRoomQuitReason: {
        values: {
          Active: 0,
          CallTimeout: 1,
          PingTimeout: 2
        }
      },
      TransReq: {
        fields: {
          items: {
            rule: "repeated",
            type: "TransItem",
            id: 1
          },
          targetLang: {
            type: "string",
            id: 2
          },
          sourceLang: {
            type: "string",
            id: 3
          }
        }
      },
      TransItem: {
        fields: {
          key: {
            type: "string",
            id: 1
          },
          content: {
            type: "string",
            id: 2
          }
        }
      },
      SetTopMsgReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          },
          msgId: {
            type: "string",
            id: 3
          }
        }
      },
      GetTopMsgReq: {
        fields: {
          targetId: {
            type: "string",
            id: 1
          },
          channelType: {
            type: "ChannelType",
            id: 2
          }
        }
      },
      TopMsg: {
        fields: {
          msg: {
            type: "DownMsg",
            id: 1
          },
          operator: {
            type: "UserInfo",
            id: 2
          },
          createdTime: {
            type: "int64",
            id: 3
          }
        }
      },
      AddFavoriteMsgReq: {
        fields: {
          senderId: {
            type: "string",
            id: 1
          },
          receiverId: {
            type: "string",
            id: 2
          },
          channelType: {
            type: "ChannelType",
            id: 3
          },
          msgId: {
            type: "string",
            id: 4
          }
        }
      },
      QryFavoriteMsgsReq: {
        fields: {
          limit: {
            type: "int64",
            id: 1
          },
          offset: {
            type: "string",
            id: 2
          }
        }
      },
      FavoriteMsgs: {
        fields: {
          items: {
            rule: "repeated",
            type: "FavoriteMsg",
            id: 1
          },
          offset: {
            type: "string",
            id: 2
          }
        }
      },
      FavoriteMsg: {
        fields: {
          msg: {
            type: "DownMsg",
            id: 1
          },
          createdTime: {
            type: "int64",
            id: 2
          }
        }
      }
    }
  }
});

export { $root as default };
