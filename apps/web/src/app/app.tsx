import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ShellLayout } from '../shared/components/layout/ShellLayout';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { PlaceholderPage } from '../pages/placeholder/PlaceholderPage';
import { NotFoundPage } from '../pages/not-found/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ShellLayout />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="pdf-tools"
          element={
            <PlaceholderPage
              title="PDF 처리 엔진"
              description="PDF 문서 병합, 분할, 메타데이터 제거 및 최적화 도구가 곧 제공됩니다."
              icon="picture_as_pdf"
            />
          }
        />
        <Route
          path="dbml-tools"
          element={
            <PlaceholderPage
              title="DBML 스키마 변환기"
              description="DBML 기반 ERD 시각화 및 PostgreSQL/MySQL DDL 생성 도구가 곧 제공됩니다."
              icon="schema"
            />
          }
        />
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
  );
}

export default App;
