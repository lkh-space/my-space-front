import { Route, Routes } from 'react-router-dom';
import { AuthProvider, CurrentUser } from '../entities/auth';
import { ShellLayout } from '../shared/components/layout/ShellLayout';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { PdfToolsPage } from '../pages/pdf-tools/PdfToolsPage';
import { DbmlToolsPage } from '../pages/dbml-tools';
import { MarkdownDocsPage } from '../pages/markdown-docs';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';

export interface AppProps {
  initialUser?: CurrentUser | null;
}

export function App({ initialUser }: AppProps = {}) {
  return (
    <AuthProvider initialUser={initialUser}>
      <Routes>
        <Route path="/" element={<ShellLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="pdf-tools" element={<PdfToolsPage />} />
        <Route path="dbml-tools" element={<DbmlToolsPage />} />
        <Route path="docs/*" element={<MarkdownDocsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </AuthProvider>
  );
}

export default App;
