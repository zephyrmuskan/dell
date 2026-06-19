import React from 'react';
import type { Severity } from '../context/WorkflowContext';

interface AlertBadgeProps {
  severity: Severity;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ severity }) => {
  const styles = {
    Critical: 'bg-brand-red/10 text-brand-red border-brand-red/30',
    High: 'bg-brand-amber/10 text-brand-amber border-brand-amber/30',
    Medium: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border tracking-wide uppercase ${styles[severity]}`}>
      {severity}
    </span>
  );
};
export default AlertBadge;
