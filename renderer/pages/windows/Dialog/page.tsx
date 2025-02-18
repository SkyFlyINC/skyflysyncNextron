'use client'
import React, {useEffect, useState} from 'react';
import { Card, Alert, Flex } from 'antd';
import Layout from '../layout';
import { ClientPacks, ServerPacks } from '../../../../types';

const WarningCard = () => {
    const [title,setTitle] = useState("加载中...");
    const [content,setContent] = useState(" ");
    const [sender,setSender] = useState(" ");
    useEffect(() => {
        window.ipc.invoke('getDialogMessage').then((data:ClientPacks.AlertMessage)=>{
            setContent(data.message)
            setTitle(data.title)
            setSender(data.sender)
        })
    }, []);
    return (
        <Layout>
            
            <Flex justify='center' align='center'><Card title={title} bordered={true} style={{width: 500}}>{content}</Card>
                </Flex>
        

    <Alert style={{margin: 10}} message={"本条由" + sender + "老师创建"} type="warning" showIcon/></Layout>
    );
};

export default WarningCard;
