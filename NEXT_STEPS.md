# 다음 작업 — JW Wine Archive 디자인 리뉴얼

> 대화 컨텍스트 이어가기용 노트. 새 세션에서 이 파일 + AGENTS.md + CLAUDE.md를 먼저 읽으세요.

## 현재 위치 (2026-05-20)

**Phase 1 완료** (commit `e0c49ca`) — 비주얼 리스킨 (cream/bordeaux 토큰, 글래스 카드, italic serif 폰트, 랜덤 빈야드 배경)

**Phase 2 완료** (이 커밋) — 레이아웃 재구성:
- 홈 피드: 2열 → 1열 풀폭 카드 (Option A: 풀블리드 사진 + 하단 cream glass 패널 오버레이)
- 상세 모달: bottom sheet 구조 (사진 50vh 헤로 + drag handle)
- 분석 페이지: 완전 재작성 (italic 영문 숫자, 가로 막대) + 모든 섹션을 `glass-card--light`로 wrap (가독성 개선, Option 1)
- AddWineModal: 다크 헤더 → cream paper, bordeaux solid 버튼들

## 다음 할 일 — Phase 3 (Motion)

이미 일부 들어가있음 (fade-in-up, glass-card hover). 추가 필요:

- [ ] Vineyard parallax — `bg-vineyard`에 `transform: translateY(scrollY * -0.35)` (rAF 사용)
- [ ] Scroll-linked blur boost — 스크롤 내려갈수록 배경 blur 6→20px
- [ ] Number counter — 분석 페이지 "Forty-six" 같은 큰 숫자에 카운트업 애니메이션
- [ ] Hairline reveal — section divider가 scaleX 0→1로 그려짐
- [ ] Bottom sheet drag-to-dismiss — `framer-motion` 또는 `@use-gesture/react` 설치 필요
- [ ] View Transitions API — 라우트 변경시 cream 페이드 (Phase 4 라우트 추가 후)

**중요**: 모든 모션은 `@media (prefers-reduced-motion: reduce)`에서 무효화해야 함. [app/globals.css](app/globals.css)에 이미 globals 룰 있음

## Phase 4 (신규 페이지)

라우트 3개 추가:
- [ ] `/wishlist` — 마실 와인 트래커 (가장 쉬움, **먼저 추천**)
- [ ] `/memories` — 1년 전 오늘 회상 + 홈 위젯
- [ ] `/map` — 마신 와인 지도 (`react-simple-maps` 설치 필요)

탭 네비게이션도 [홈, 분석] → [홈, 분석, 위시] 확장 필요.

## 알려진 기술 부채

1. **이미지 73MB** — `public/*.webp` 11장이 git 히스토리에. sharp/imagemagick으로 1600px WebP 압축 권장 (8MB → 500KB)
2. **API 라우트 regex `s` 플래그** — `app/api/tasting/route.ts:48` IDE 에러. tsconfig `target` 을 ES2020으로 올리면 해결
3. **`next.config.ts` eslint 옵션** — Next 16에서 deprecated. 분리 필요

## 백업

- 백업 브랜치: `backup-before-redesign` (Phase 1 시작 전, commit 5321ed0)
- 전체 롤백: `git checkout backup-before-redesign`
- 부분 롤백: `git revert <commit>`

## 외부 참조 문서

다음 3개 문서는 코드베이스 외부에 있음 (사용자가 첨부해줘야 함):
- DESIGN_BRIEF.md — 콘셉트, 토큰, 모션 카탈로그
- FEATURES.md — Phase 4 페이지 명세
- WORK_ORDER.md — Phase 1~4 체크리스트

대화 컨텍스트 손실시 사용자에게 재첨부 요청.

## 메모리 시스템

`c:\Users\USER\.claude\projects\c--Users-USER-wine-journal\memory\` 에 추가 컨텍스트:
- `project_overview.md` — 스택, 라우트, 컴포넌트 파일 매핑
- `design_tokens.md` — 컬러/타이포/글래스 시스템
- `phase_progress.md` — 단계별 상세 진행상황
- `reference_brief.md` — 외부 문서 의존성 메모
- `image_assets.md` — public/ 이미지 인벤토리
- `preexisting_issues.md` — IDE 에러지만 무시해도 되는 것들
