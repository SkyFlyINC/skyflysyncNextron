// pages/Schedule.tsx
'use client'
import React, { SetStateAction, useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { Card, Carousel, Flex, Progress, Steps, notification } from 'antd';
import { ClientPacks } from '../../../types';
import { NotificationPlacement } from 'antd/es/notification/interface';
import { CSSProperties } from 'react';

const { Step } = Steps;

interface Position {
    x: number;
    y: number;
}

interface WindowSize {
    width: string;
    height: string;
}

const Schedule: React.FC = () => {
    const [scheduleData, setSchedule] = useState<ClientPacks.Class[]>([]);
    const [currentClassNumber, setCurrentClass] = useState<number>(0);
    const [currentClassName, setCurrentClassName] = useState<string>("课间");
    const [networkState, setNetworkState] = useState<boolean>(true);
    const [windowSize, setWindowSize] = useState<WindowSize>({ width: '100%', height: '100%' });
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [opacity, setOpacity] = useState<number>(1);
    const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
    const [remainingTimeText, setRemainingTimeText] = useState<string>('');
    const [progressPercent, setProgressPercent] = useState<number>(0);
        // 格式化剩余时间
        const formatRemainingTime = (seconds: number): string => {
            if (seconds >= 3600) {
                // 超过1小时，显示小时
                return `${Math.floor(seconds / 3600)}时${Math.floor((seconds % 3600) / 60)}分`;
            } else if (seconds >= 60) {
                // 超过1分钟，显示分钟
                return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
            } else {
                // 不足1分钟，只显示秒
                return `${seconds}秒`;
            }
        };
    useEffect(() => {
        window.ipc.on('updateRemainingTime', (data: {
            remainingSeconds: number,
            totalSeconds: number, // 假设后端也发送了总时长
            currentClass: ClientPacks.Class
        }) => {
            setRemainingSeconds(data.remainingSeconds);
            setCurrentClassName(data.currentClass.subject)
            // 计算进度百分比
            const percent = Math.round(
                ((data.totalSeconds - data.remainingSeconds) / data.totalSeconds) * 100
            );
            setProgressPercent(percent);

            // 设置显示文本
            setRemainingTimeText(formatRemainingTime(data.remainingSeconds));
        });

        window.ipc.on('nerworkState', (_event: any, state: boolean) => {
            setNetworkState(state);
        });

        window.ipc.on('alert', (event: string) => {
            alert(event);
        });

        window.ipc.on('onMessage', (msg: string) => {
            openNotification('topRight',"有新的班级消息", msg);
        });
        window.ipc.on('onClassEnd', (msg: string) => {
            openNotification('topRight',"下课时间到了",null);
        });

        window.ipc.on('updateClasses', (msg: ClientPacks.ClassUpdateMessage) => {
            if (msg.classList) {
                setSchedule(msg.classList);
            }
        });

        window.ipc.on('updateCurrentClass', (msg: SetStateAction<number>) => {
            setCurrentClass(msg);
        });

        const handleResize = (): void => {
            setWindowSize({
                width: `${window.innerWidth}px`,
                height: `${window.innerHeight}px`,
            });
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
        setIsDragging(true);
        const startX = e.clientX - position.x;
        const startY = e.clientY - position.y;

        const handleMouseMove = (e: MouseEvent): void => {
            if (isDragging) {
                const newX = e.clientX - startX;
                const newY = e.clientY - startY;
                const maxX = window.innerWidth - 400;
                const maxY = window.innerHeight - 200;
                
                setPosition({
                    x: Math.max(0, Math.min(newX, maxX)),
                    y: Math.max(0, Math.min(newY, maxY))
                });
            }
        };

        const handleMouseUp = (): void => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            window.ipc.send('set-ignore-mouse-events', true);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseEnter = (): void => {
        window.ipc.send('set-ignore-mouse-events', true);
        setOpacity(0.3);
    };

    const handleMouseLeave = (): void => {
        if (!isDragging) {
            window.ipc.send('set-ignore-mouse-events', true);
            setOpacity(1);
        }
    };

    const today = new Date().toLocaleDateString();
    const [api, contextHolder] = notification.useNotification();

    const openNotification = (placement: NotificationPlacement,title:string, msg: string): void => {
        api.info({
            message: title,
            description: msg,
            placement,
        });
    };

    const todayEvents = scheduleData.map(event => ({ ...event, date: today }));
    const containerStyle: CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        WebkitUserSelect: 'none',
        userSelect: 'none',
        opacity: opacity,
        transition: 'opacity 0.3s ease',
    } as const;

    const cardStyle: CSSProperties = {
        background: 'rgba(255, 255, 255, 1)',
        backdropFilter: 'blur(5px)',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
    };

    return (
        <div
            style={containerStyle}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {contextHolder}
            <Flex gap="small" align="start">
            <Card title={currentClassName+"时间还有"} style={cardStyle}>
                    <Progress 
                        size={90} 
                        type="circle" 
                        percent={100-progressPercent} 
                        format={() => remainingTimeText}
                        // 可以根据剩余时间设置不同的状态颜色
                        status={
                            remainingSeconds < 180 ? 'exception' :
                            remainingSeconds < 300 ? 'active' : 'success'
                        }
                    />
                </Card>

                <Card style={cardStyle}>
                    <Steps size={'default'} current={currentClassNumber}>
                        {todayEvents.map((event) => {
                            if (event.show) {
                                return (
                                    <Step 
                                        key={event.turn} 
                                        title={event.subject} 
                                        description={event.time}
                                    />
                                );
                            }
                            return null;
                        })}
                    </Steps>
                </Card>
            </Flex>
        </div>
    );
};

export default Schedule;