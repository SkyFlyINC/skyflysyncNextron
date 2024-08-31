'use client'
import React, { ReactNode, useEffect, useState } from 'react';
import VirtualList from 'rc-virtual-list';
import { Avatar, Card, List, Button, Layout, Menu, message, Space, QRCode, Row, Col, Popover, Switch, TimePicker, Progress, Flex, Typography, Divider, Dropdown, Input, ConfigProvider } from 'antd';
import { BookOutlined, CaretDownOutlined, DownOutlined, DownloadOutlined, FileOutlined, MenuOutlined, MessageOutlined, MoreOutlined, SettingOutlined } from '@ant-design/icons';
const { Header, Content, Sider } = Layout;
const { Meta } = Card;
import { Empty } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import TextField from "@mui/material/TextField";
import { Layout as Lo } from '../layout';
import { Margin } from '@mui/icons-material';
import { ipcMain } from 'electron';
import Icon from '@ant-design/icons/lib/components/Icon';
import { CardContent } from '@mui/material';
import { ClientPacks, ServerPacks, UserState, config as Config, sendServerJSONwithCommand } from '../../../../types'
import { Image } from 'antd';


interface task {
    description: string;
    id: number;
    cmd: string;
}


const MessageList: React.FC = () => {
    const [messageData, setMessageData] = useState([]);
    const [config, setConfig] = useState();
    const [activeTab, setActiveTab] = useState<'messages' | 'settings'>('messages');
    const [tasks, setTasks] = useState()
    const [getMsgStarter,setGetMsgStarter] = useState(-11);
    const [loadPointId,setLoadPointId] = useState(0);

    const appendData = async () => {
        await window.ipc.invoke('getMessages',getMsgStarter).then(([data,newStarter]:[ClientPacks.MessageItem[],number]) => {
            setGetMsgStarter(newStarter);
            if(!data){
                message.warning("没有更多了")
                return;
            }
            
            let downloadProgressesTemp = {};
            data.forEach(item => {
                if(item.attachments && item.attachments.length > 0){
                    item.attachments.forEach(attachment=>{
                        window.ipc.invoke('checkFileExistance', item.senderName, attachment.filename).then((existance) => {
                            if (existance) {
                                downloadProgressesTemp = {
                                    ...downloadProgressesTemp,
                                    [attachment.hashValue]: 100,
                                }
                            }
                            setDownloadProgresses({...downloadProgresses,...downloadProgressesTemp})
                        })
                    })
                }
            });
            setMessageData([...data,...messageData]);
            setLoadPointId(data[data.length-1]?data[data.length-1].id:0)
            message.success(`${data.length} 条被加载!`);
            setTimeout(() => { document.location.href = '#loadPoint' }, 200)
        })
    };
    const [userData, setUserData] = useState({
        userId: undefined,
        userName: undefined
    });
    useEffect(() => {
        appendData();
        window.ipc.on('onMessage', (msg) => {
            setMessageData((prevData) => [...prevData, msg]);
            message.success(`有新消息!`);
            setTimeout(() => { document.location.href = '#bottom' }, 200)

        })
        window.ipc.on('download-progress', (progress: number, hashValue: string) => {
            setDownloadProgresses((prevProgresses) => ({
                ...prevProgresses,
                [hashValue]: progress, // 更新对应的下载进度
            }));
        });
        window.ipc.on('download-complete', (hashValue: string) => {
            setDownloadProgresses((prevProgresses) => ({
                ...prevProgresses,
                [hashValue]: 100,
            }));
        });
        window.ipc.on('download-error', (hashValue: string) => {
            setDownloadProgresses((prevProgresses) => ({
                ...prevProgresses,
                [hashValue]: -1,
            }));
        });
        window.ipc.invoke('getUserData').then((data) => {
            setUserData(data);
        })
        window.ipc.invoke('getConfig').then((data) => {
            setConfig(data);
        })
    }, []);


    const handleTabChange = (tab: 'messages' | 'settings') => {
        setActiveTab(tab);
        tab == 'messages' ? setTimeout(() => { document.location.href = '#bottom' }, 80) : null;
    };

    const handleDownload = (hashValue: string, filename: string, sender: string) => {
        window.ipc.send('downloadFile', hashValue, filename, sender)
    };

    function handleOpen(sender: string, filename: string,): void {
        window.ipc.invoke('openFile', sender, filename)
    }

    function handleOpenFolder(sender: string): void {
        window.ipc.invoke('openFolder', sender)
    }

    function fullScreenDisplay(msgid:number){
        messageData.forEach((msg:ClientPacks.MessageItem)=>{
            if(msgid == msg.id){
                window.ipc.invoke('showSignalMessage',msg)
            }
        })
    }

    function DeleteMessage(msgid:number){
        messageData.forEach((msg:ClientPacks.MessageItem,index)=>{
            if(msgid == msg.id){
                let temp = [...messageData];
                temp.splice(index,1);
                setMessageData(temp);
                window.ipc.invoke('deleteMessage',msgid).then((state)=>{
                    if(state == true){   
                        message.success("删除成功")  
                    }
                })
            }
        })  
    }

    const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
        if (e.currentTarget.scrollTop == 0&& activeTab == 'messages') {
            appendData();
        }
    };

    const [downloadProgresses, setDownloadProgresses] = useState({})


    return (
        <Lo>
            <Layout style={{ maxHeight: '78vh' }}>
                <Sider width={110} theme="light">
                    <Flex style={{ width: 111 }} justify='flex-start' align='flex-start'>
                        <Menu style={{ width: 111 }} defaultSelectedKeys={['messages']}>
                            <Menu.Item style={{ width: 90, alignSelf: 'flex-start' }} onClick={() => handleTabChange('messages')} key="messages" icon={<MessageOutlined />}>
                                消息
                            </Menu.Item>
                            <Menu.Item style={{ width: 90, alignSelf: 'flex-start' }} onClick={() => handleTabChange('settings')} key="settings" icon={<SettingOutlined />}>
                                设置
                            </Menu.Item>
                            <Menu.Item style={{ width: 90, alignSelf: 'flex-start' }} onClick={() => { window.ipc.invoke('openHomeworkWindow') }} icon={<BookOutlined />}>
                                作业
                            </Menu.Item>
                        </Menu>
                    </Flex>
                </Sider>
                <Content onScroll={onScroll} style={{ margin: 8, overflowY: 'auto', maxHeight: '75vh', minHeight: '75vh' }}>
                    {messageData.length > 0 || activeTab !== 'messages' ? null : <Empty></Empty>}
                    {activeTab === 'messages' && (
                        <><VirtualList
                            data={messageData}
                            itemHeight={100}
                            itemKey={(item: ClientPacks.MessageItem) => item.id}
                             
                        >
                            {(item: ClientPacks.MessageItem) => (
                                <List.Item key={item.id}>
                                    <Card  style={{ margin: 3 }}>
                                        <Flex justify='space-between' align='flex-start'>
                                            <Meta

                                                avatar={<Avatar size={40}>{item.senderName}</Avatar>}
                                                title={item.title ? item.title : "无标题"}
                                                description={`发送者： ${item.senderName}`} />

                                            <Dropdown

                                                menu={{
                                                    items: [
                                                        {
                                                            label: <a onClick={()=>{fullScreenDisplay(item.id)}}>详细信息</a>,
                                                            key: '0',
                                                        },
                                                        {
                                                            type: 'divider',
                                                        },
                                                        {
                                                            label: <a onClick={()=>{DeleteMessage(item.id)}}>删除</a>,
                                                            key: '1',
                                                            danger: true,
                                                        },
                                                    ]
                                                }}
                                                trigger={['click']}>
                                                <a onClick={(e) => e.preventDefault()}>
                                                    <Space>
                                                        <MenuOutlined />
                                                    </Space>
                                                </a>
                                            </Dropdown>

                                        </Flex>

                                        <p>{item.content}</p>
                                        {item.attachments && item.attachments.length > 0 && (
                                            <>
                                                {item.attachments.map((attachment, index) => {
                                                    return (
                                                        <ConfigProvider
                                theme={{
                                  components: {
                                    Card: {
                                        colorBgContainer:"#fafafa"
                                    },
                                  },
                                }}
                              ><Card type="inner" style={{marginBottom:13}}>

                              <Flex justify='space-between' align='center'>
                                  <Flex gap={15}><FileOutlined></FileOutlined><h4>{attachment.filename.length > 32 ? attachment.filename.substring(0, 32) + "..." : attachment.filename}</h4></Flex>
                                  {
                                      downloadProgresses[attachment.hashValue] ?
                                          downloadProgresses[attachment.hashValue] == 100 ?
                                              <Flex gap={5}><Button
                                                  onClick={() => handleOpen(item.senderName, attachment.filename)}
                                              >
                                                  打开
                                              </Button>
                                                  <Button
                                                      onClick={() => handleOpenFolder(item.senderName)}>
                                                      打开文件夹
                                                  </Button></Flex> :
                                              null
                                          : <Button
                                              icon={<DownloadOutlined />}
                                              style={{ margin: '5px', maxWidth: 430 }}
                                              type="dashed"
                                              onClick={() => handleDownload(attachment.hashValue, attachment.filename, item.senderName)}
                                          >
                                              下载
                                          </Button>
                                  }

                              </Flex>
                              {/* {
                                attachment.filename.substring(attachment.filename.length-3,attachment.filename.length) == 'jpg' ?   <Image
                                width={200}
                                height={200}
                                src=
                                fallback="data:image/png;base64,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"
                              /> :null
                              } */}
                              {
                                  downloadProgresses[attachment.hashValue] ? (<><Progress status={downloadProgresses[attachment.hashValue] == -1 ? 'exception' : downloadProgresses[attachment.hashValue] == 100 ? 'success' : 'active'} percent={downloadProgresses[attachment.hashValue].toFixed(1)} /></>) :
                                      null}
                            
                          </Card></ConfigProvider>
                                                        

                                                    )
                                                }
                                                )}
                                            </>
                                        )}
                                    </Card>
                                    {loadPointId == item.id?<div id="loadPoint"></div>:null}
                                </List.Item>
                            )}

                        </VirtualList>
                            <div id="bottom"></div>
                        </>
                    )}
                    {activeTab === 'settings' && (
                        <Row align="middle" style={{ minHeight: '20vh', margin: 10 }}>
                            <Col style={{ margin: 10 }}>
                                <div>
                                    <Space>
                                        <Popover overlayInnerStyle={{ padding: 0 }} content={<QRCode value={JSON.stringify(userData)} bordered={false} />}>
                                            <Card title="基本信息" bordered={false}>
                                                <Space><TextField style={{ margin: 10 }}
                                                    disabled
                                                    id="outlined-disabled"
                                                    label="班级ID"
                                                    defaultValue={userData.userId}
                                                /></Space>

                                                <Space>
                                                    <TextField style={{ margin: 10 }}
                                                        disabled
                                                        id="outlined-disabled"
                                                        label="班级名称"
                                                        defaultValue={userData.userName}
                                                    /></Space>
                                            </Card>
                                        </Popover>
                                    </Space>
                                </div>
                            </Col>
                            <Card title="功能设置" bordered={false} style={{ margin: 10 }}>
                                <Col><Space><Switch defaultChecked onChange={(checked: boolean) => { window.ipc.invoke("setScheduleWindowDisplay", checked) }} /><p>使用课程表</p></Space></Col>
                                <Col><Space><Switch defaultChecked onChange={(checked: boolean) => {
                                    let tempConfig = config as Config.Config;
                                    tempConfig.allowAlert = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }
                                } /><p>开启消息提示</p></Space></Col>
                                <Col><Space><Switch defaultChecked onChange={(checked: boolean) => {
                                    let tempConfig = config as Config.Config;
                                    tempConfig.autoShowHomework = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }} /><p>自习作业展示</p></Space></Col>
                                <Col><Space><Switch defaultChecked onChange={(checked: boolean) => {
                                    let tempConfig = config as Config.Config;
                                    tempConfig.autoDownloadFiles = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }} /><p>自动下载文件</p></Space></Col>
                                
                            </Card>
                            <Card title="定时任务设置" bordered={false} style={{ margin: 10 }}>
                                <Col><Space><Switch style={{ margin: 20 }} defaultChecked onChange={(checked: boolean) => {
                                    let tempConfig = config as Config.Config;
                                    tempConfig.useTasks = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }} /><p>开启定时任务</p></Space>
                                </Col>
                                <Col>
                                    <Button>打开任务面板</Button>

                                </Col>
                            </Card>

                        </Row>

                    )}
                </Content>
            </Layout></Lo>
    );
};

export default MessageList;
