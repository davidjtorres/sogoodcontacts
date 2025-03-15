import React from 'react';

// Mock Dialog component
export const Dialog = ({ children, open, onOpenChange }: { 
  children: React.ReactNode; 
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  if (!open) return null;
  return (
    <div data-testid="dialog">
      {onOpenChange && (
        <button onClick={() => onOpenChange(false)} data-testid="dialog-close">
          Close Dialog
        </button>
      )}
      {children}
    </div>
  );
};

// Mock DialogContent component
export const DialogContent = ({ children, className }: { 
  children: React.ReactNode; 
  className?: string 
}) => (
  <div data-testid="dialog-content" className={className}>
    {children}
  </div>
);

// Mock DialogHeader component
export const DialogHeader = ({ children, className }: { 
  children: React.ReactNode; 
  className?: string 
}) => (
  <div data-testid="dialog-header" className={className}>
    {children}
  </div>
);

// Mock DialogTitle component
export const DialogTitle = ({ children, className }: { 
  children: React.ReactNode; 
  className?: string 
}) => (
  <h2 data-testid="dialog-title" className={className}>
    {children}
  </h2>
);

// Mock DialogFooter component
export const DialogFooter = ({ children, className }: { 
  children: React.ReactNode; 
  className?: string 
}) => (
  <div data-testid="dialog-footer" className={className}>
    {children}
  </div>
);

// Export default
export default Dialog; 