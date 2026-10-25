import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import {
  i18n,
  setAppLanguage,
  getSavedLocale,
  LOCALE_STORAGE_KEY,
} from './index';

const TestConsumer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('dashboard.headerTitle')}</h1>
      <p>{t('pdfTools.header.title')}</p>
    </div>
  );
};

describe('i18n Internationalization & Language Switching', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await setAppLanguage('ko');
  });

  it('기본 로케일은 한국어(ko)이며 HTML lang 속성이 ko로 동기화되어야 한다', () => {
    expect(i18n.resolvedLanguage).toBe('ko');
    expect(getSavedLocale()).toBe('ko');
    expect(document.documentElement.lang).toBe('ko');
  });

  it('setAppLanguage("en") 호출 시 localStorage와 document.documentElement.lang이 en으로 갱신되어야 한다', async () => {
    await setAppLanguage('en');

    expect(i18n.resolvedLanguage).toBe('en');
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(getSavedLocale()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('setAppLanguage를 통해 언어 전환 시 useTranslation을 구독하는 컴포넌트가 즉시 재렌더링되어야 한다', async () => {
    render(<TestConsumer />);

    expect(screen.getByText('워크스페이스 개요')).toBeTruthy();
    expect(screen.getByText('PDF 처리 엔진')).toBeTruthy();

    await setAppLanguage('en');

    expect(await screen.findByText('Workspace Overview')).toBeTruthy();
    expect(screen.getByText('PDF Processing Engine')).toBeTruthy();

    await setAppLanguage('ko');

    expect(await screen.findByText('워크스페이스 개요')).toBeTruthy();
    expect(screen.getByText('PDF 처리 엔진')).toBeTruthy();
  });
});
