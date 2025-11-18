'use client'
import React, { useEffect, useState } from 'react';
import VirtualList from 'rc-virtual-list';
import { Card, List, Layout, Menu, message, Space, QRCode, Row, Col, Popover, Switch, Flex, Collapse } from 'antd';
import { BookOutlined, MessageOutlined, SettingOutlined } from '@ant-design/icons';
const { Header, Content, Sider } = Layout;
const { Meta } = Card;
import { Empty } from 'antd';
import TextField from "@mui/material/TextField";
import { Layout as Lo } from '../layout';
import { ClientPacks, config} from '../../../../types'
import dynamic from 'next/dynamic';

import MessageCard from '../../../coms/MessageCard';

interface task {
    description: string;
    id: number;
    cmd: string;
}


const MessageList: React.FC = () => {
    const [messageData, setMessageData] = useState([]);
    const [configData, setConfig] = useState<config.Config>();
    const [activeTab, setActiveTab] = useState<'messages' | 'settings'>('messages');
    const [tasks, setTasks] = useState()
    const [getMsgStarter, setGetMsgStarter] = useState(-11);
    const [loadPointId, setLoadPointId] = useState(0);

    const appendData = async () => {
        await window.ipc.invoke('getMessages', getMsgStarter).then(([data, newStarter]: [ClientPacks.MessageItem[], number]) => {
            setGetMsgStarter(newStarter);
            if (!data) {
                message.warning("没有更多了")
                return;
            }
            setMessageData([...data, ...messageData]);
            setLoadPointId(data[data.length - 1] ? data[data.length - 1].id : 0)
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



    function fullScreenDisplay(msgid: number) {
        messageData.forEach((msg: ClientPacks.MessageItem) => {
            if (msgid == msg.id) {
                window.ipc.invoke('showSingleMessage', msg)
            }
        })
    }

    function DeleteMessage(msgid: number) {
        messageData.forEach((msg: ClientPacks.MessageItem, index) => {
            if (msgid == msg.id) {
                let temp = [...messageData];
                temp.splice(index, 1);
                setMessageData(temp);
                window.ipc.invoke('deleteMessage', msgid).then((state) => {
                    if (state == true) {
                        message.success("删除成功")
                    }
                })
            }
        })
    }

    const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
        if (e.currentTarget.scrollTop == 0 && activeTab == 'messages') {
            appendData();
        }
    };



    return (
        <Lo>
            <Layout style={{ minHeight: '78vh' }}>
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
                <Content onScroll={onScroll} style={{ margin: 8, overflowY: 'auto', maxHeight: '80vh', minHeight: '78vh' }}>
                    {messageData.length > 0 || activeTab !== 'messages' ? null : <Empty></Empty>}
                    {activeTab === 'messages' && (
                        <><VirtualList
                            data={messageData}
                            itemHeight={100}
                            itemKey={(item: ClientPacks.MessageItem) => item.id}

                        >
                            {(item: ClientPacks.MessageItem) => (
                                <List.Item key={item.id}>
                                    <MessageCard
                                        item={item}
                                        fullScreenDisplay={fullScreenDisplay}
                                        DeleteMessage={DeleteMessage}
                                    />
                                    {loadPointId == item.id ? <div id="loadPoint"></div> : null}
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
                            <Flex wrap="wrap" gap="large">                                <Space><Switch defaultValue={configData.isScheduleShow} onChange={(checked: boolean) => { window.ipc.invoke("setScheduleWindowDisplay", checked) }} /><p>使用课程表</p></Space>
                                <Space><Switch defaultValue={configData.allowAlert} onChange={(checked: boolean) => {
                                    let tempConfig = configData as config.Config;
                                    tempConfig.allowAlert = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }
                                } /><p>开启消息提示</p></Space><Space><Switch defaultValue={configData.autoShowHomework} onChange={(checked: boolean) => {
                                    let tempConfig = configData as config.Config;
                                    tempConfig.autoShowHomework = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }} /><p>自习作业展示</p></Space>
                                <Space><Switch defaultValue={configData.autoDownloadFiles} onChange={(checked: boolean) => {
                                    let tempConfig = configData as config.Config;
                                    tempConfig.autoDownloadFiles = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }} /><p>自动下载文件</p></Space>
</Flex>

{/* <Collapse
      items={[{ key: '1', label: '定时任务设置', children: <>
      
      </> }]}
    /> */}

                            </Card>
                                {/* <Col><Space><Switch style={{ margin: 20 }} defaultValue={configData.autoDownloadFiles} onChange={(checked: boolean) => {
                                    let tempConfig = config as config.Config;
                                    tempConfig.useTasks = checked;
                                    window.ipc.invoke("setConfig", tempConfig);
                                }} /><p>开启定时任务</p></Space>
                                </Col>
                                <Col>
                                </Col> */}


                        </Row>

                    )}
                </Content>
            </Layout></Lo>
    );
};

export default MessageList;
