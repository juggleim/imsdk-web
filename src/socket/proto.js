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
          }
        }
      },
      MentionInfo: {
        fields: {
          mentionType: {
            type: "MentionType",
            id: 1
          },
          targetIds: {
            rule: "repeated",
            type: "string",
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
          isReaded: {
            type: "bool",
            id: 15
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
          type: {
            type: "ChannelType",
            id: 3
          },
          updateTime: {
            type: "int64",
            id: 4
          },
          unreadCount: {
            type: "int32",
            id: 5
          },
          msg: {
            type: "DownMsg",
            id: 6
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
      }
    }
  }
});

export { $root as default };
