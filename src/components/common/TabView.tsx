import React, { ReactNode } from 'react';
import '../../styles/common.css';

interface TabPanelProps {
  title: string;
  children: ReactNode;
}

// Define TabPanel component
export const TabPanel: React.FC<TabPanelProps> = ({ children }) => {
  return <div className="tab-panel">{children}</div>;
};

// Set displayName for type checking
TabPanel.displayName = 'TabPanel';

interface TabViewProps {
  children: ReactNode;
  activeTab: number;
  onChangeTab: (index: number) => void;
}

export const TabView: React.FC<TabViewProps> = ({ children, activeTab, onChangeTab }) => {
  // Convert children to array for processing
  const childrenArray = React.Children.toArray(children);
  
  // A simpler approach to extract tab titles
  const tabs: string[] = [];
  
  // Use forEach with explicit type checking to avoid TypeScript errors
  React.Children.forEach(children, (child) => {
    // Check if it's a valid React element first
    if (!React.isValidElement(child)) {
      tabs.push('');
      return;
    }
    
    // Check specifically for TabPanel by displayName
    if (child.type === TabPanel || 
       (typeof child.type === 'function' && 
       (child.type as any).displayName === 'TabPanel')) {
      // Use a type assertion with a specific type instead of accessing properties
      // that TypeScript doesn't know exist
      const titleValue = (child.props as TabPanelProps).title;
      tabs.push(titleValue || '');
    } else {
      tabs.push('');
    }
  });

  return (
    <div className="tab-view">
      <div className="tab-header">
        {tabs.map((title, index) => (
          title && (
            <button
              key={index}
              className={`tab-button ${activeTab === index ? 'active' : ''}`}
              onClick={() => onChangeTab(index)}
            >
              {title}
            </button>
          )
        ))}
      </div>
      <div className="tab-content">
        {childrenArray[activeTab]}
      </div>
    </div>
  );
};
