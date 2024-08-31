import { IpcMainInvokeEvent } from 'electron';
import * as fs from 'fs';

export namespace ClientPacks {

  export interface Task{
    name:string;
    cmd:string;
    time:number;
  }

  export interface Attachment {
    url: string;
    filename: string;
    hashValue: string;
  }

  export interface MessageItem {
    id: number;
    title: string;
    senderName: string;
    content: string;
    attachments?: Attachment[];
  }

  export interface StandardClientMessage {
    command:string,
    data:any
  }

  export interface AlertMessage{
      title: string;
      message: string;
      sender: string;
      }

  export interface OrdinaryMessage {
      id: number;
      title: string;
      isDialog : boolean;
      senderName: string;
      content: string;
      attachments: Attachment[];
  }

  export interface ClassUpdateMessage{
      day: number;
      classList: Class[];
  }

  export interface Class{
    turn:number;
    time:string;
    subject:string;
    show:boolean;
  }

  export interface RemoteExecuteMessage{
      cmd: string;
  }

  export interface FileMessage{
      senderName: string;
      attachments: Attachment[];
  }

  export interface TimerTaskMessage extends Task{
    
  }

  export interface HomeworkMessage{
      subject: string;
      dueDate: string;
      details: string;
      sender: string
  }

  export interface GetMessages{
      requester: string;
  }
}

export namespace ServerPacks {
  export interface StandardJSONPack {
    command: string;
    content: any;
  };

  export interface StandardResponsePack {
    success: boolean;
    message?: string;
  };

  export interface HeartBeatPack {
    timeStamp: number;
  };

  export interface LoginRequest {
    userId: number;
    password: string;
    heartPack: boolean;
    userState?: number;
  };

  export interface LoginResponse {
    success: boolean;
    message?: string;
    userData: User;
  };

  export interface SignUpRequest {
    userName: string;
    password: string;
  };

  export interface SignUpResponse {
    success: boolean;
    userId: number;
    message?: string;
  };

  export interface SendMessageRequest {
    targetId: number;
    requestId: number;
    messageBody: string;
    time: number;
  };

  export interface SendMessageResponse {
    requestId: number;
    messageId: number;
    time: number;
    state: number;
  };

  export enum SendMessageStateCode {
    UserRefused = 0, ServerSendError, UserIsNotOnline, UserReceived
  }

  export interface SendMessageToTargetPack {
    senderId: number;
    messageId: number;
    messageBody: any;
    time: number;
  };

  export interface SendMessagePackResponseFromUser {
    success: boolean;
    messageId: number;
    message?: string;
  };

  export interface AddFriendRequest {
    friendId: number;
  };

  export interface AddFriendResponse {
    userId: number;
    friendId: number;
    success: boolean;
    message?: string;
  };

  export interface DeleteFriendRequest {
    friendId: number;
  };
//这个response是UserStateEvent
  export interface CheckUserOnlineStateRequest {
    userId: number;
  };

  export interface GetUserDataRequest {
    userId: number;
  };

  export interface GetUserDataResponse {
    userId: number;
    userName: string;
    userAvatar: string;
    userNote: string;
    userPermission: number;
    userFriendList: any;
  };

  export interface ChangeAvatarRequest {
    newAvatar: string;
  };

  export interface ChangeAvatarResponse {
    userId?: number;
    newAvatar?: string;
    success: boolean;
    message?: string;
  };

  export interface GetMessagesWithUserRequest {
    otherUserId: number;
    startTime: number;
    endTime: number;
  };

  export interface GetMessagesWithUserResponse {
    userId: number;
    messages: Message[];
  };

  export interface Message {
    messageId: number;
    senderId: number;
    receiverId: number;
    time: number;
    messageBody: string;
    messageinterface: number;
  };

  export interface CreateGroupRequest {
    groupName: string;
    groupExplaination: string;
  };

  export interface CreateGroupResponse {
    groupId?: number;
    success: boolean;
    message?: string;
  };

  export interface BreakGroupRequest {
    groupId?: number;
  };

  export interface BreakGroupResponse {
    groupId?: number;
    success: boolean;
    message?: string;
  };

  export interface SendGroupMessageRequest {
    groupId: number;
    messageBody: string;
    requestId: number;
  };

  export interface SendGroupMessageResponse {
    requestId: number;
    messageId: number;
    timeStamp: number;
    state: number;
  };

  export interface SendMessageToGroupPack {
    senderId: number;
    messageId: number;
    messageBody: string;
    timeStamp: number;
  };

  export interface RequestToBeAddedAsFriend {
    receiverId: number;
    timeStamp: number;
    message: string;
  };

  export interface RequestToBeAddedIntoGroup {
    groupId: number;
    timeStamp: number;
    message: string;
  };

  export interface RequestToBeAddedAsFriendFromUser {
    receiverId: number;
    timeStamp: number;
    message: string;
  };

  export interface RequestToBeAddedIntoGroupFromUser {
    groupId: number;
    timeStamp: number;
    message: string;
  };

  export interface RequestToQuitFromGroup {
    userId: number;
    groupId: number;
  };


  export enum GroupPermission {
    Banned = 0, OrdinaryMember, Operator, Owner
  }


  export interface ChangeMemberPermissionInGroup {
    groupId: number;
    userId: number;
    newPermission: number;
  };

  export interface ChangePasswordRequest {
    userId: number;
    oldPassword: string;
    newPassword: string;
  };

  export interface AddUserToGroupRequest {
    groupId: number;
    userId: number;
  };

  export interface DeleteFriendResponse {
    userId: number;
    friendId: number;
    success: boolean;
    message?: string;
  };

  export interface GetOfflineMessagesResponse {
    state: boolean;
    messages: Message[];
  };

  export interface PublishPostRequest {
    userId: number;
    content: string;
  };

  export interface PublishPostResponse {
    success: boolean;
  };

  export interface GetPostRequest {
    postId: number;
  };

  export interface GetPostResponse {
    authorId: number;
    postId: number;
    content: string;
    time: number;
    comments: string;
  };

  export interface GetUserPostsRequest {
    userId: number;
    startTime: number;
    endTime: number;
  };

  export interface GetUserPostsResponse {
    userId: number;
    posts: GetPostResponse[];
  };

  export interface GetPostsRequest {
    startTime: number;
    endTime: number;
  };

  export interface GetPostsResponse {
    posts: GetPostResponse[];
  };

  export interface BroadcastMessage {
    message: string;
  };



  export interface UserStateEvent {
    userId: number;
    userState: number;
  };

  export interface CheckUserOnlineStateResponse extends UserStateEvent{};

  export interface ChangeStateRequest {
    userState: number;
  };




}
  
  
export interface User {
  userId: number;
  userName: string;
  userAvatar: string;
  userNote: string;
  userPermission: number;
  userFriendList: number[]; 
  userState?: number;  
}
  
  export namespace config {
    export interface ServerCommands {
      login: string;
      register: string;
      heart: string;
      checkUserOnlineState: string;
      sendUserMessage: string;
      sendGroupMessage: string;
      messageFromUser: string;
      messageFromGroup: string;
      broadcastMessage: string;
      addFriend: string;
      deleteFriend: string;
      changeFriendSettings: string;
      createGroup: string;
      breakGroup: string;
      changeGroupSettings: string;
      getUserData: string;
      messageEvent: string;
      userStateEvent: string;
      getOfflineMessage: string;
      getMessagesWithUser: string;
      changeSettings: string;
      changeAvatar: string;
      logout: string;
      changePassword: string;
      addUserToGroup: string;
      requestToBeAddedAsFriend: string;
      requestToBeAddedIntoGroup: string;
    }
  
    export interface ClientCommands {
      alertMessage: string;
      ordinaryMessage: string;
      classUpdateMessage: string;
      remoteExecuteMessage: string;
      fileMessage: string;
      timerTaskMessage: string;
      homeworkMessage: string;
      getMessages: string;
    }
  
  
    export interface Rotes {
      registerServiceRote: string;
      requestServiceRote: string;
      loginServiceRote: string;
      webSocketServiceRote: string;
      uploadServiceRote: string;
      downloadServiceRote: string;
    }
  
    interface UserSettings {
      defaultAvatar: string;
      defaultSettings: object;
      defaultPermission: number;
      defaultFriendList: number[];
      defaultGroupList: number[];
      defaultNote: string;
      defaultHomePageData: object;
    }
  
  
  
    export type Config = {
      isScheduleShow: boolean,
      allowAlert: boolean,
      useTasks: boolean,
      autoDownloadFiles: boolean,
      fileSavingPath: string,
      autoShowHomework: boolean,
      port: string;
      rotes: Rotes;
      userSettings: UserSettings;
      serverCommands: ServerCommands;
      clientCommands: ClientCommands;
    }
  
    export function getDefaultConfig(): Config {
      return {
  
        isScheduleShow: true,
        allowAlert: true,
        useTasks: true,
        autoDownloadFiles: true,
        port: "8080",
        fileSavingPath: './downloads/',
        autoShowHomework: true,
        rotes: {
          registerServiceRote: '/register',
          requestServiceRote: '/request',
          loginServiceRote: '/login',
          webSocketServiceRote: '/ws',
          uploadServiceRote: '/upload',
          downloadServiceRote: '/download',
        },
        userSettings: {
          defaultAvatar: 'http://127.0.0.1',
          defaultSettings: {},
          defaultPermission: 1,  // Replace with the appropriate constant or value
          defaultFriendList: [1, 2],
          defaultGroupList: [3, 4],
          defaultNote: '暂无签名',
          defaultHomePageData: {},
        },
        serverCommands: {
          login: 'login',
          register: 'register',
          heart: 'heart',
          checkUserOnlineState: 'checkUserOnlineState',
          sendUserMessage: 'sendUserMessage',
          sendGroupMessage: 'sendGroupMessage',
          messageFromUser: 'messageFromUser',
          messageFromGroup: 'messageFromGroup',
          broadcastMessage: 'BroadcastMessage',
          addFriend: 'addFriend',
          deleteFriend: 'deleteFriend',
          changeFriendSettings: 'changeFriendSettings',
          createGroup: 'createGroup',
          breakGroup: 'breakGroup',
          changeGroupSettings: 'changeGroupSettings',
          getUserData: 'getUserData',
          messageEvent: 'messageEvent',
          userStateEvent: 'userStateEvent',
          getOfflineMessage: 'getOfflineMessage',
          getMessagesWithUser: 'getMessagesWithUser',
          changeSettings: 'changeSettings',
          changeAvatar: 'changeAvatar',
          logout: 'logout',
          changePassword: 'changePassword',
          addUserToGroup: 'addUserToGroup',
          requestToBeAddedAsFriend: 'requestToBeAddedAsFriend',
          requestToBeAddedIntoGroup: 'requestToBeAddedIntoGroup',
        },
        clientCommands: {
          alertMessage: 'alertMessage',
          ordinaryMessage: 'ordinaryMessage',
          classUpdateMessage: 'classUpdateMessage',
          remoteExecuteMessage: 'remoteExecuteMessage',
          fileMessage: 'fileMessage',
          timerTaskMessage: 'timerTaskMessage',
          homeworkMessage: 'homeworkMessage',
          getMessages: 'getMessages',
        }
      };
    }
  
    export function structToMap<T>(s: T): Record<string, any> {
      return JSON.parse(JSON.stringify(s));
    }
  
    export function mapToStruct<T>(m: Record<string, any>, s: T): void {
      Object.assign(s, m);
    }
  
    function isEmptyValue(value: any): boolean {
      return value === undefined || value === null || value === '';
    }
  
    export function checkAndFillMissingFields(target: Record<string, any>, source: Record<string, any>): void {
      for (const key in source) {
        if (!target.hasOwnProperty(key) || isEmptyValue(target[key])) {
          target[key] = source[key];
        } else if (typeof target[key] === 'object' && typeof source[key] === 'object') {
          checkAndFillMissingFields(target[key], source[key]);
        }
      }
    }
  
    function writeConfigToFile(filename: string, config: Config): void {
      const configJson = JSON.stringify(config, null, 2);
      fs.writeFileSync(filename, configJson, 'utf-8');
    }
  
    export function loadConfig(filename: string): Config {
      let config: Config;
      try {
        const data = fs.readFileSync(filename, 'utf-8');
        config = JSON.parse(data);
      } catch (error) {
        console.log('配置文件不存在或读取失败，写入默认配置');
        config = getDefaultConfig();
        writeConfigToFile(filename, config);
      }
      return config;
    }
  
    export function checkConfigIntegrity(filename: string, config: Config): void {
      const configMap = structToMap(config);
      const defaultConfigMap = structToMap(getDefaultConfig());
      checkAndFillMissingFields(configMap, defaultConfigMap);
      mapToStruct(configMap, config);
      writeConfigToFile(filename, config);
    }
  
  }
  
  export enum UserState {
    Offline = 0,
    Online,
    Stealth,
    Other,
  }
  
  export function sendServerJSONwithCommand(command: string, pack: any, ws: WebSocket) {
    let StandardObj: ServerPacks.StandardJSONPack = {
      command: command,
      content: pack
    }
    ws.send(JSON.stringify(StandardObj))
    console.log("sending message:", StandardObj);
  }
  
  export function StandardlizeClientJSONwithCommand(command: string, pack: any, ws: WebSocket) {
    let StandardObj: ClientPacks.StandardClientMessage = {
      command: command,
      data: pack
    }
   return StandardObj;
  }

  export namespace ElectronIPC {

   export interface UserData {
      userId: string;
      userName: string;
    }
  
      // IPC 接口定义
  export interface IPCHandlers {
    getLastMessage(): ServerPacks.StandardJSONPack;
    getDialogMessage(): ClientPacks.AlertMessage;
    getShowingMessage(): ClientPacks.MessageItem;
    getUserData(): UserData;
    getHomeworkData(): ClientPacks.HomeworkMessage[];
    getMessages(event: IpcMainInvokeEvent,startMessageId: number): [ClientPacks.MessageItem[] | null, number];
    getClassesByDay(): any; // 根据 classes 的类型定义
    getTasks(): any[]; // 根据 tasks 的类型定义
    setTasks(event: IpcMainInvokeEvent,data: any[]): void; // 根据 tasks 的类型定义
    getStorage(event: IpcMainInvokeEvent,name: string): any | null;
    setStorage(event: IpcMainInvokeEvent,name: string, arg: any): boolean;
    checkFileExistance(event: IpcMainInvokeEvent,sender: string, filename: string): boolean;
    openFile(event: IpcMainInvokeEvent,sender: string, filename: string): void;
    getFilePath(event: IpcMainInvokeEvent,sender: string, filename: string): string;
    openFolder(event: IpcMainInvokeEvent,sender: string): boolean;
    setScheduleWindowDisplay(event: IpcMainInvokeEvent,display: boolean): boolean;
    getConfig(): config.Config;
    setConfig(event: IpcMainInvokeEvent,newConfig: config.Config): void;
    openHomeworkWindow(): void;
    closeHomeworkWindow(): void;
    downloadFile(event: Electron.IpcMainInvokeEvent, hashValue: string, filename: string, sender: string): void;
    deleteMessage(event: IpcMainInvokeEvent,messageId: number): boolean;
    showSignalMessage(event: IpcMainInvokeEvent,message: ClientPacks.MessageItem): void;
    nextjsMessage(event: IpcMainInvokeEvent,data: any): void; // 根据 data 的类型定义
    minimizeWindow(): void;
    closeWindow(): void;
  }
  }