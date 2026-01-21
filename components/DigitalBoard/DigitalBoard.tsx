
import React from 'react';
import { InfiniteCanvas } from './Canvas/InfiniteCanvas';
import { Toolbar } from './Tools/Toolbar';
import { PropertiesPanel } from './Tools/PropertiesPanel';
import { Minimap } from './Canvas/Minimap';

export const DigitalBoard: React.FC = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Toolbar />
      <PropertiesPanel />
      <Minimap />
      <InfiniteCanvas />
    </div>
  );
};
