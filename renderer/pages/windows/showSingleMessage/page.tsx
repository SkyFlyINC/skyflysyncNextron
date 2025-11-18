'use client'
import React, {useEffect, useState} from 'react';
import { Card, Alert, Flex } from 'antd';
import Layout from '../layout';
import { ClientPacks } from '../../../../types';
import MessageCard from '../../../coms/MessageCard';

const WarningCard = () => {
    const [item,setItem] = useState<ClientPacks.MessageItem>();
    useEffect(() => {
        window.ipc.invoke('getShowingMessage').then((data:ClientPacks.MessageItem)=>{
            setItem(data);
        })
    }, []);
    return (
        <Layout title='独立窗口'>
            <MessageCard item={item}></MessageCard></Layout>
    );
};

export default WarningCard;
