import React from 'react';

const BulkImportWrapper: React.FC = () => {
  const Component = React.lazy(() => import('./BulkImport'));
  return <Component />;
};

export default BulkImportWrapper;
