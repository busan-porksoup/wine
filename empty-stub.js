// vite.config.ts에서 sharp를 이 빈 모듈로 바꿔 끼움 — sharp는 네이티브 모듈이라 Workers에서 못 돌고, 앱 코드도 쓰지 않음
export default {};
