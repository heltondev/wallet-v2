import React from 'react';
import Svg, { type SvgProps } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
  children?: React.ReactNode;
}

export const Icon: React.FC<IconProps> = ({
  size = 24,
  color = '#FAFAFA',
  stroke = 1.5,
  fill = 'none',
  children,
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Svg>
);
