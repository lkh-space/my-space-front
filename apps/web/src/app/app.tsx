import { Route, Routes } from 'react-router-dom';
import { AuthProvider, CurrentUser } from '../entities/auth';
import { ShellLayout } from '../shared/components/layout/ShellLayout';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { PdfToolsPage } from '../pages/pdf-tools/PdfToolsPage';
import { DbmlToolsPage } from '../pages/dbml-tools';
import { PlaceholderPage } from '../pages/placeholder/PlaceholderPage';
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
        <Route
          path="docs"
          element={
            <PlaceholderPage
              title="마크다운 문서 뷰어"
              description="로컬 프로젝트 사양(Spec) 및 아키텍처 결정(ADR) 뷰어가 곧 제공됩니다."
              icon="description"
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </AuthProvider>
  );
}

export default App;
