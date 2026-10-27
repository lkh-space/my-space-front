import { describe, it, expect } from 'vitest';
import {
  extractTagsFromContent,
  extractTitleFromContent,
  updateFrontmatterTagsInContent,
} from './MarkdownEditorView';

describe('MarkdownEditorView Helper Functions', () => {
  describe('extractTitleFromContent', () => {
    it('Frontmatter 내부의 title 속성을 최우선 추출한다', () => {
      const md = `---
title: 프론트매터 제목
tags: [test]
---

# 본문 제목
본문 내용
`;
      expect(extractTitleFromContent(md)).toBe('프론트매터 제목');
    });

    it('Frontmatter에 title이 없으면 본문 첫 번째 # 헤딩을 추출한다', () => {
      const md = `---
tags: [test]
---

# 본문 첫 헤딩
내용
`;
      expect(extractTitleFromContent(md)).toBe('본문 첫 헤딩');
    });

    it('Frontmatter가 아예 없을 때 본문 첫 번째 # 헤딩을 추출한다', () => {
      const md = `# 순수 마크다운 헤딩\n일반 텍스트`;
      expect(extractTitleFromContent(md)).toBe('순수 마크다운 헤딩');
    });
  });

  describe('extractTagsFromContent', () => {
    it('인라인 [tag1, tag2] 형태의 태그를 올바르게 파싱한다', () => {
      const md = `---
title: 제목
tags: [react, typescript, architecture]
---
# 본문
`;
      expect(extractTagsFromContent(md)).toEqual([
        'react',
        'typescript',
        'architecture',
      ]);
    });

    it('리스트 형태 (- tag1)의 태그를 올바르게 파싱한다', () => {
      const md = `---
tags:
  - design
  - sprint-1
  - notes
---
# 본문
`;
      expect(extractTagsFromContent(md)).toEqual([
        'design',
        'sprint-1',
        'notes',
      ]);
    });

    it('단일 줄 콤마 구분 형태(tags: tag1, tag2)를 올바르게 파싱한다', () => {
      const md = `---
tags: frontend, ui-ux, v2
---
# 본문
`;
      expect(extractTagsFromContent(md)).toEqual(['frontend', 'ui-ux', 'v2']);
    });

    it('태그에 # 접두사가 붙어있어도 제거하고 정제한다', () => {
      const md = `---
tags: [#dev, #ops]
---
`;
      expect(extractTagsFromContent(md)).toEqual(['dev', 'ops']);
    });

    it('Frontmatter 앞에 빈 줄이나 공백이 있어도 정상 파싱한다', () => {
      const md = `
  
---
tags: [resilient]
---
`;
      expect(extractTagsFromContent(md)).toEqual(['resilient']);
    });
  });

  describe('updateFrontmatterTagsInContent', () => {
    it('기존 인라인 Frontmatter tags를 새 태그 목록으로 정확히 치환한다', () => {
      const md = `---
title: 내 문서
tags: [old1, old2]
author: user@test.local
---
# 본문
`;
      const updated = updateFrontmatterTagsInContent(md, ['new1', 'new2']);
      expect(extractTagsFromContent(updated)).toEqual(['new1', 'new2']);
      expect(updated).toContain('title: 내 문서');
      expect(updated).toContain('author: user@test.local');
    });

    it('기존 리스트 형태 Frontmatter tags를 인라인 새 태그 목록으로 깔끔하게 치환한다', () => {
      const md = `---
title: 내 문서
tags:
  - old1
  - old2
author: user@test.local
---
# 본문
`;
      const updated = updateFrontmatterTagsInContent(md, ['clean-tag']);
      expect(extractTagsFromContent(updated)).toEqual(['clean-tag']);
      expect(updated).toContain('tags: [clean-tag]');
      expect(updated).toContain('author: user@test.local');
    });

    it('기존 Frontmatter에 tags 속성이 없을 때 tags 속성을 추가한다', () => {
      const md = `---
title: 태그 없는 문서
---
# 본문
`;
      const updated = updateFrontmatterTagsInContent(md, ['first-tag', 'second-tag']);
      expect(extractTagsFromContent(updated)).toEqual(['first-tag', 'second-tag']);
      expect(updated).toContain('tags: [first-tag, second-tag]');
      expect(updated).toContain('title: 태그 없는 문서');
    });

    it('Frontmatter가 아예 없는 마크다운에 Frontmatter 블록을 생성한다', () => {
      const md = `# 일반 마크다운
내용입니다.
`;
      const updated = updateFrontmatterTagsInContent(md, ['brand-new']);
      expect(extractTagsFromContent(updated)).toEqual(['brand-new']);
      expect(updated.startsWith('---')).toBe(true);
      expect(updated).toContain('tags: [brand-new]');
      expect(updated).toContain('# 일반 마크다운');
    });
  });
});
