import React from 'react';
// @ts-ignore
import { createPortal } from 'react-dom';

export const renderPortal = (children: React.ReactNode): React.ReactNode => {
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(children, document.body);
  }
  return children;
};
