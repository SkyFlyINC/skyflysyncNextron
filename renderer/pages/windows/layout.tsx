'use client'
import { Card, Button, Alert, Flex } from 'antd';
import { LineOutlined, CloseOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import Draggable from 'react-draggable';
import React, { useEffect, useState } from "react";

const { Meta } = Card;

export const Layout = ({
  children,
  title = "SkyFlySync 课堂管理系统",
  fullscreen = false
}: {
  children: React.ReactNode;
  title?: string;
  fullscreen?: boolean;
}) => {
  const [networkState, setNetworkState] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const [windowSize, setWindowSize] = useState({ width: '100%', height: '100%' });

  useEffect(() => {
    window.ipc.on('nerworkState', (event, state: boolean) => {
        setNetworkState(state);
      });

    window.ipc.on('alert', (event: string) => {
      alert(event);
    });

    const handleResize = () => {
      setWindowSize({
        width: `$${window.innerWidth}px`,
        height: `${window.innerHeight}px`,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初始化大小

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleMinimize = () => {
    window.ipc.send('minimizeWindow', null);
  };

  const handleClose = () => {
    window.ipc.send('closeWindow', null);
  };

  const toggleFullscreen = () => {
    window.ipc.send('toggleFullscreen', isFullscreen);
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Draggable handle=".drag-handle" disabled={isFullscreen}>
      <Card
        style={{
          width: windowSize.width,
          height: windowSize.height,
          position: 'fixed', top: 0, left: 0,
        }}
        title={
          <div className="drag-handle" style={{ userSelect: 'none' }}>
            {title}
          </div>
        }
        bordered={false}
        extra={
          <Flex align='center' gap={10}>
            {!networkState && (
              <Alert
                message="网络连接已断开"
                type="warning"
                showIcon
              />
            )}
            <Flex align='center'>
              <Button
                type="text"
                icon={<LineOutlined />}
                onClick={handleMinimize}
              />
              <Button
                type="text"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleClose}
              />
            </Flex>
          </Flex>
        }
      >
        {children}
      </Card>
    </Draggable>
  );
};

export default Layout;