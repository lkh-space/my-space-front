import React, { useCallback, useMemo } from 'react';
import CodeMirror, { EditorView, ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { useAssetUpload } from './useAssetUpload';

interface MarkdownCodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  readOnly?: boolean;
}

export const MarkdownCodeEditor: React.FC<MarkdownCodeEditorProps> = ({
  value,
  onChange,
  className = '',
  readOnly = false,
}) => {
  const editorRef = React.useRef<ReactCodeMirrorRef>(null);

  // 커서 위치 또는 텍스트 끝에 텍스트 삽입
  const handleInsertText = useCallback(
    (textToInsert: string) => {
      const view = editorRef.current?.view;
      if (view) {
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: textToInsert },
          selection: { anchor: from + textToInsert.length },
        });
        view.focus();
      } else {
        onChange(value + textToInsert);
      }
    },
    [onChange, value],
  );

  const { isUploading, uploadError, handlePaste, handleDrop } = useAssetUpload({
    onInsertMarkdown: handleInsertText,
  });

  // CodeMirror 다크 모드 징크 테마
  const customTheme = useMemo(
    () =>
      EditorView.theme(
        {
          '&': {
            backgroundColor: '#0d0e15',
            color: '#e3e1ec',
            fontSize: '13px',
            fontFamily: '"JetBrains Mono", monospace',
            height: '100%',
          },
          '.cm-content': {
            caretColor: '#adc6ff',
            padding: '12px 16px',
            lineHeight: '20px',
          },
          '.cm-cursor': {
            borderLeftColor: '#adc6ff',
            borderLeftWidth: '2px',
          },
          '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
            {
              backgroundColor: '#27272a !important',
            },
          '.cm-gutters': {
            backgroundColor: '#0d0e15',
            color: '#71717a',
            borderRight: '1px solid #27272a',
            paddingRight: '8px',
          },
          '.cm-lineNumbers .cm-gutterElement': {
            fontSize: '11px',
            fontFamily: '"JetBrains Mono", monospace',
            minWidth: '28px',
            textAlign: 'right',
            paddingRight: '8px',
          },
          '.cm-activeLine': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: '#adc6ff',
          },
        },
        { dark: true },
      ),
    [],
  );

  return (
    <div
      className={`markdown-code-editor-wrap relative h-full flex flex-col ${className}`}
      onPaste={handlePaste}
      onDrop={handleDrop}
    >
      {/* Uploading Status Overlay */}
      {isUploading && (
        <div className="absolute top-2 right-4 z-20 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-sky-300 flex items-center gap-2 shadow-lg animate-pulse">
          <span className="material-symbols-outlined text-sm animate-spin">
            progress_activity
          </span>
          <span>이미지 업로드 중...</span>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="px-4 py-2 bg-red-950/80 border-b border-red-800 text-xs text-red-200 flex items-center justify-between">
          <span>{uploadError}</span>
        </div>
      )}

      <CodeMirror
        ref={editorRef}
        value={value}
        height="100%"
        theme={customTheme}
        extensions={[markdown(), EditorView.lineWrapping]}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          foldGutter: false,
        }}
      />
    </div>
  );
};
