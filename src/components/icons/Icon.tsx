import React from 'react';

export interface IconProps {
  d?: string | string[];
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
  children?: React.ReactNode;
}

export const Icon: React.FC<IconProps> = ({
  d,
  size = 20,
  color = 'currentColor',
  stroke = 1.75,
  fill = 'none',
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {children ||
      (Array.isArray(d) ? (
        d.map((p, i) => <path key={i} d={p} />)
      ) : (
        <path d={d} />
      ))}
  </svg>
);
