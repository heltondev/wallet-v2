import React from 'react';
import { Path, Line, Circle, Rect, Polyline, Polygon } from 'react-native-svg';
import { Icon, type IconProps } from './Icon';

type IconComponentProps = Omit<Partial<IconProps>, 'children'>;

export const Icons: Record<string, React.FC<IconComponentProps>> = {
  home: (p) => (
    <Icon {...p}>
      <Path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </Icon>
  ),
  list: (p) => (
    <Icon {...p}>
      <Line x1={8} y1={6} x2={21} y2={6} />
      <Line x1={8} y1={12} x2={21} y2={12} />
      <Line x1={8} y1={18} x2={21} y2={18} />
      <Circle cx={3.5} cy={6} r={1.2} />
      <Circle cx={3.5} cy={12} r={1.2} />
      <Circle cx={3.5} cy={18} r={1.2} />
    </Icon>
  ),
  trending: (p) => (
    <Icon {...p}>
      <Polyline points="3 17 9 11 13 15 21 7" />
      <Polyline points="15 7 21 7 21 13" />
    </Icon>
  ),
  grid: (p) => (
    <Icon {...p}>
      <Rect x={3} y={3} width={7} height={7} />
      <Rect x={14} y={3} width={7} height={7} />
      <Rect x={3} y={14} width={7} height={7} />
      <Rect x={14} y={14} width={7} height={7} />
    </Icon>
  ),
  settings: (p) => (
    <Icon {...p}>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Icon>
  ),
  plus: (p) => (
    <Icon {...p}>
      <Line x1={12} y1={5} x2={12} y2={19} />
      <Line x1={5} y1={12} x2={19} y2={12} />
    </Icon>
  ),
  chevL: (p) => (
    <Icon {...p}>
      <Polyline points="15 18 9 12 15 6" />
    </Icon>
  ),
  chevR: (p) => (
    <Icon {...p}>
      <Polyline points="9 18 15 12 9 6" />
    </Icon>
  ),
  chevD: (p) => (
    <Icon {...p}>
      <Polyline points="6 9 12 15 18 9" />
    </Icon>
  ),
  arrowUp: (p) => (
    <Icon {...p}>
      <Line x1={12} y1={19} x2={12} y2={5} />
      <Polyline points="5 12 12 5 19 12" />
    </Icon>
  ),
  arrowDown: (p) => (
    <Icon {...p}>
      <Line x1={12} y1={5} x2={12} y2={19} />
      <Polyline points="19 12 12 19 5 12" />
    </Icon>
  ),
  search: (p) => (
    <Icon {...p}>
      <Circle cx={11} cy={11} r={7} />
      <Line x1={21} y1={21} x2={16.65} y2={16.65} />
    </Icon>
  ),
  filter: (p) => (
    <Icon {...p}>
      <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </Icon>
  ),
  swap: (p) => (
    <Icon {...p}>
      <Polyline points="17 1 21 5 17 9" />
      <Path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <Polyline points="7 23 3 19 7 15" />
      <Path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </Icon>
  ),
  cart: (p) => (
    <Icon {...p}>
      <Circle cx={9} cy={21} r={1} />
      <Circle cx={20} cy={21} r={1} />
      <Path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </Icon>
  ),
  utensils: (p) => (
    <Icon {...p}>
      <Path d="M3 2v7c0 1.1.9 2 2 2h4V2" />
      <Path d="M7 2v20" />
      <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </Icon>
  ),
  car: (p) => (
    <Icon {...p}>
      <Path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
      <Circle cx={7.5} cy={17.5} r={2.5} />
      <Circle cx={16.5} cy={17.5} r={2.5} />
    </Icon>
  ),
  house: (p) => (
    <Icon {...p}>
      <Path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-4v-7h-8v7H4a1 1 0 0 1-1-1z" />
    </Icon>
  ),
  heart: (p) => (
    <Icon {...p}>
      <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </Icon>
  ),
  film: (p) => (
    <Icon {...p}>
      <Rect x={2} y={2} width={20} height={20} rx={2.18} ry={2.18} />
      <Line x1={7} y1={2} x2={7} y2={22} />
      <Line x1={17} y1={2} x2={17} y2={22} />
      <Line x1={2} y1={12} x2={22} y2={12} />
      <Line x1={2} y1={7} x2={7} y2={7} />
      <Line x1={2} y1={17} x2={7} y2={17} />
      <Line x1={17} y1={17} x2={22} y2={17} />
      <Line x1={17} y1={7} x2={22} y2={7} />
    </Icon>
  ),
  briefcase: (p) => (
    <Icon {...p}>
      <Rect x={2} y={7} width={20} height={14} rx={2} />
      <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Icon>
  ),
  repeat: (p) => (
    <Icon {...p}>
      <Polyline points="17 1 21 5 17 9" />
      <Path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <Polyline points="7 23 3 19 7 15" />
      <Path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </Icon>
  ),
  book: (p) => (
    <Icon {...p}>
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </Icon>
  ),
  wallet: (p) => (
    <Icon {...p}>
      <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <Path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </Icon>
  ),
  trash: (p) => (
    <Icon {...p}>
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </Icon>
  ),
  pencil: (p) => (
    <Icon {...p}>
      <Path d="M12 20h9" />
      <Path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
    </Icon>
  ),
  check: (p) => (
    <Icon {...p}>
      <Polyline points="20 6 9 17 4 12" />
    </Icon>
  ),
  x: (p) => (
    <Icon {...p}>
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Icon>
  ),
  bell: (p) => (
    <Icon {...p}>
      <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Icon>
  ),
  moon: (p) => (
    <Icon {...p}>
      <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </Icon>
  ),
  download: (p) => (
    <Icon {...p}>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Polyline points="7 10 12 15 17 10" />
      <Line x1={12} y1={15} x2={12} y2={3} />
    </Icon>
  ),
  cloud: (p) => (
    <Icon {...p}>
      <Path d="M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </Icon>
  ),
  user: (p) => (
    <Icon {...p}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Icon>
  ),
  alert: (p) => (
    <Icon {...p}>
      <Circle cx={12} cy={12} r={10} />
      <Line x1={12} y1={8} x2={12} y2={12} />
      <Line x1={12} y1={16} x2={12.01} y2={16} />
    </Icon>
  ),
  paw: (p) => (
    <Icon {...p}>
      <Path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
      <Path d="M5.5 7c-.8 0-1.5.7-1.5 1.5S4.7 10 5.5 10 7 9.3 7 8.5 6.3 7 5.5 7z" />
      <Path d="M18.5 7c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5S19.3 7 18.5 7z" />
      <Path d="M8.5 4C7.7 4 7 4.7 7 5.5S7.7 7 8.5 7 10 6.3 10 5.5 9.3 4 8.5 4z" />
      <Path d="M15.5 4c-.8 0-1.5.7-1.5 1.5S14.7 7 15.5 7 17 6.3 17 5.5 16.3 4 15.5 4z" />
      <Path d="M12 16c-2.2 0-4 1.3-4 3 0 .6.2 1.1.5 1.5.5.6 1.3 1 2.2 1h2.6c.9 0 1.7-.4 2.2-1 .3-.4.5-.9.5-1.5 0-1.7-1.8-3-4-3z" />
    </Icon>
  ),
  shoppingBag: (p) => (
    <Icon {...p}>
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <Line x1={3} y1={6} x2={21} y2={6} />
      <Path d="M16 10a4 4 0 0 1-8 0" />
    </Icon>
  ),
  plane: (p) => (
    <Icon {...p}>
      <Path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
    </Icon>
  ),
  fileText: (p) => (
    <Icon {...p}>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Polyline points="14 2 14 8 20 8" />
      <Line x1={16} y1={13} x2={8} y2={13} />
      <Line x1={16} y1={17} x2={8} y2={17} />
      <Polyline points="10 9 9 9 8 9" />
    </Icon>
  ),
  shield: (p) => (
    <Icon {...p}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Icon>
  ),
  gift: (p) => (
    <Icon {...p}>
      <Polyline points="20 12 20 22 4 22 4 12" />
      <Rect x={2} y={7} width={20} height={5} />
      <Line x1={12} y1={22} x2={12} y2={7} />
      <Path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <Path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </Icon>
  ),
  tool: (p) => (
    <Icon {...p}>
      <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </Icon>
  ),
  zap: (p) => (
    <Icon {...p}>
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Icon>
  ),
  coffee: (p) => (
    <Icon {...p}>
      <Path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <Path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <Line x1={6} y1={1} x2={6} y2={4} />
      <Line x1={10} y1={1} x2={10} y2={4} />
      <Line x1={14} y1={1} x2={14} y2={4} />
    </Icon>
  ),
  users: (p) => (
    <Icon {...p}>
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  ),
  camera: (p) => (
    <Icon {...p}>
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx={12} cy={13} r={4} />
    </Icon>
  ),
  upload: (p) => (
    <Icon {...p}>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Polyline points="17 8 12 3 7 8" />
      <Line x1={12} y1={3} x2={12} y2={15} />
    </Icon>
  ),
};
