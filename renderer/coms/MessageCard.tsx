// MessageCard.tsx
import React, { useEffect, useState } from 'react';
import { Avatar, Card, Button, Space, Progress, Dropdown, Menu, Flex, ConfigProvider } from 'antd';
import { FileOutlined, DownloadOutlined, MenuOutlined } from '@ant-design/icons';
import { ClientPacks } from '../../types';  

const { Meta } = Card;

interface MessageCardProps {
  item: ClientPacks.MessageItem;
  fullScreenDisplay?: (msgid: number) => void;
  DeleteMessage?: (msgid: number) => void;
}
const handleDownload = (hashValue: string, filename: string, sender: string) => {
  window.ipc.send('downloadFile', hashValue, filename, sender)
};

function handleOpen(sender: string, filename: string,): void {
  window.ipc.invoke('openFile', sender, filename)
}

function handleOpenFolder(sender: string): void {
  window.ipc.invoke('openFolder', sender)
}
const MessageCard: React.FC<MessageCardProps> = ({
  item,
  fullScreenDisplay = null,
  DeleteMessage = null,
}) => {
  const [downloadProgresses, setDownloadProgresses] = useState({})

  useEffect(()=>{
    if (item) {
      window.ipc.on('download-progress', (progress: number, hashValue: string) => {
        if (item.attachments.find(attachment=>attachment.hashValue == hashValue)) {
          setDownloadProgresses((prevProgresses) => ({
            ...prevProgresses,
            [hashValue]: progress, // 更新对应的下载进度
        }));
        }

    });
    window.ipc.on('download-complete', (hashValue: string) => {
      if (item.attachments.find(attachment=>attachment.hashValue == hashValue)) {
        setDownloadProgresses((prevProgresses) => ({
            ...prevProgresses,
            [hashValue]: 100,
        }));}
    });
    window.ipc.on('download-error', (hashValue: string) => {
      if (item.attachments.find(attachment=>attachment.hashValue == hashValue)) {
        setDownloadProgresses((prevProgresses) => ({
            ...prevProgresses,
            [hashValue]: -1,
        }));}
    });
  
    let downloadProgressesTemp = {};
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
    }
    

  }

  
  ,[item])
  return (
    
    <Card  style={{ margin: 3 }}>
      {item?      <>
      <Flex justify='space-between' align='flex-start'>
        <Meta

            avatar={<Avatar size={40}>{item.senderName? item.senderName:"错误"}</Avatar>}
            title={item.title ? item.title : "无标题"}
            description={`发送者： ${item.senderName}`} />
{
  DeleteMessage?        <Dropdown
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
</Dropdown>:null
}


    </Flex>
    <p>{item.content}</p>
    {item?.attachments && item.attachments.length > 0 && (
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
><Card loading={item == null || item == undefined} type="inner" style={{marginBottom:13}}>

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
downloadProgresses[attachment.hashValue] ? (<><Progress status={downloadProgresses[attachment.hashValue] == -1 ? 'exception' : downloadProgresses[attachment.hashValue] == 100 ? 'success' : 'active'} percent={Number(downloadProgresses[attachment.hashValue].toFixed(1))} /></>) :
  null}

</Card></ConfigProvider>
                    

                )
            }
            )}
        </>
    )}
      </>:null}
</Card>
  );
};

export default MessageCard;