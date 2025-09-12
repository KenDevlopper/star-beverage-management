
import React from 'react';
import {
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  Bar,
  Line,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface ChartProps {
  data: any;
  height?: number;
  width?: number;
  options?: any;
}

export const BarChart = ({ data, height = 300, options = {} }: ChartProps) => {
  const config = {
    default: { color: "var(--primary)" },
  };

  return (
    <ChartContainer config={config} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data.labels.map((label: string, index: number) => {
          const obj: Record<string, any> = { name: label };
          data.datasets.forEach((dataset: any, i: number) => {
            obj[dataset.label] = dataset.data[index];
          });
          return obj;
        })}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          {options.plugins?.legend?.position !== "none" && <Legend />}
          {data.datasets.map((dataset: any, index: number) => (
            <Bar 
              key={dataset.label} 
              dataKey={dataset.label} 
              fill={dataset.backgroundColor || `var(--primary)`}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export const LineChart = ({ data, height = 300, options = {} }: ChartProps) => {
  const config = {
    default: { color: "var(--primary)" },
  };

  return (
    <ChartContainer config={config} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data.labels.map((label: string, index: number) => {
          const obj: Record<string, any> = { name: label };
          data.datasets.forEach((dataset: any) => {
            obj[dataset.label] = dataset.data[index];
          });
          return obj;
        })}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          {options.plugins?.legend?.position !== "none" && <Legend />}
          {data.datasets.map((dataset: any) => (
            <Line 
              key={dataset.label} 
              type="monotone" 
              dataKey={dataset.label} 
              stroke={dataset.borderColor || dataset.backgroundColor || `var(--primary)`}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export const PieChart = ({ data, height = 300, options = {} }: ChartProps) => {
  const config = {
    default: { color: "var(--primary)" },
  };
  
  return (
    <ChartContainer config={config} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data.labels.map((label: string, index: number) => ({
              name: label,
              value: data.datasets[0].data[index]
            }))}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.labels.map((entry: string, index: number) => (
              <Cell 
                key={`cell-${index}`} 
                fill={data.datasets[0].backgroundColor[index] || `var(--primary)`} 
              />
            ))}
          </Pie>
          {options.plugins?.legend?.position !== "none" && <Legend />}
          <Tooltip />
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
