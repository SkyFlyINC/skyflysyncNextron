'use client'
import type { ProColumns } from '@ant-design/pro-components';
import { CellEditorTable } from '@ant-design/pro-components';
import React, { useEffect, useState } from 'react';

type DataSourceType = {
  id: React.Key;
  title?: string;
  cmd?: string;
  time?:string;
  state?: string;
  created_at?: number;
  children?: DataSourceType[];
};

const defaultData: DataSourceType[] = [];;

export default () => {

  useEffect(()=>{
    
  })

  const [dataSource, setDataSource] = useState<readonly DataSourceType[]>(
    () => defaultData,
  );

  const columns: ProColumns<DataSourceType>[] = [
    {
      title: '任务名称',
      dataIndex: 'title',
      width: '30%',
      formItemProps: {
        rules: [
          {
            required: true,
            whitespace: true,
            message: '此项是必填项',
          },

        ],
      },
    },
    {
      title: '状态',
      key: 'state',
      dataIndex: 'state',
      valueType: 'select',
      valueEnum: {
        open: {
          text: '停用',
          status: 'Off',
        },
        closed: {
          text: '启用',
          status: 'On',
        },
      },
    },
    {
      title: 'CMD',
      dataIndex: 'cmd',
    },
    {
        title: '时间',
        dataIndex: 'time',
      },
  ];

  return (
    <>
      <CellEditorTable<DataSourceType>
        headerTitle="任务列表"
        columns={columns}
        rowKey="id"
        scroll={{
          x: 960,
        }}
        value={dataSource}
        onChange={setDataSource}
        recordCreatorProps={{
          newRecordType: 'dataSource',
          record: () => ({
            id: Date.now(),
          }),
        }}
      />
    </>
  );
};