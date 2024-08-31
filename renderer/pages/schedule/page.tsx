// pages/Schedule.js
'use client'
import React, { SetStateAction, useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { Card, Steps } from 'antd';
import { ClientPacks } from '../../../types';

const { Step } = Steps
const Schedule = () => {
    const [scheduleData, setSchedule] = useState([
    ]);
    const [currentClass, setCurrentClass] = useState(0);
    useEffect(() => {
        window.ipc.on('updateClasses', (msg: ClientPacks.ClassUpdateMessage) => {

            if (msg.classList) {
                setSchedule(msg.classList);
            }
        })
        window.ipc.on('updateCurrentClass', (msg: SetStateAction<number>) => {
            setCurrentClass(msg)
        })
    }, []);
    const today = new Date().toLocaleDateString();

    const todayEvents = scheduleData.map(event => ({ ...event, date: today }));

    return (
        <Card style={{ width: 130 }}>
            <Steps size={todayEvents.length > 11 ? 'small' : 'default'} progressDot current={currentClass} direction="vertical">
                {todayEvents.map((event, index) => {
                    if (event.show) { return (<Step key={event.turn} title={event.subject} description={event.time} />) }
                }
                )}
            </Steps>
        </Card>
    );
};

export default Schedule;
