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
          }
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
          }
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
      Conversation: {
        fields: {
          converId: {
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
          updateTime: {
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
          latestReadedMsgIndex: {
            type: "int64",
            id: 7
          },
          LatestMentionMsg: {
            type: "MentionMsg",
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
          userInfo: {
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
      SyncChatroomMsgReq: {
        fields: {
          syncTime: {
            type: "int64",
            id: 1
          },
          chatroomId: {
            type: "string",
            id: 4
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
          Msg: 1
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
          msgType: {
            type: "string",
            id: 5
          },
          msgContent: {
            type: "bytes",
            id: 6
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
          msgIndex: {
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
          }
        }
      },
      QryTotalUnreadCountReq: {
        fields: {}
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
          }
        }
      },
      QryMentionMsgsResp: {
        fields: {
          mentionMsgs: {
            rule: "repeated",
            type: "MentionMsg",
            id: 1
          },
          isFinished: {
            type: "bool",
            id: 2
          }
        }
      },
      MentionMsg: {
        fields: {
          mentionType: {
            type: "MentionType",
            id: 1
          },
          msgId: {
            type: "string",
            id: 2
          },
          msgIndex: {
            type: "int64",
            id: 3
          },
          msgTime: {
            type: "int64",
            id: 4
          },
          senderInfo: {
            type: "UserInfo",
            id: 5
          }
        }
      },
      QryUploadTokenResp: {
        oneofs: {
          ossOf: {
            oneof: [
              "qiniuCred"
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
          }
        }
      },
      OssType: {
        values: {
          DefaultOss: 0,
          Qiniu: 1
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
      }
    }
  }
});

export { $root as default };
