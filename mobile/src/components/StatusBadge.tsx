import React from 'react';
import { OrderStatus } from '../navigation/types';
import './StatusBadge.css';

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status-badge status-${status.replace(' ', '-')}`}>{status}</span>;
}

