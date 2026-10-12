import type { ReactNode } from 'react';

export default function CustomerAccountLayout({ children }: { children: ReactNode }) {
  return <div className="customer-area">{children}</div>;
}
