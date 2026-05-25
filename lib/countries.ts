// 국가명 정규화 + 국기 매핑 — Analytics·Search 등에서 공통 사용

export const COUNTRY_ALIASES: Record<string, string> = {
  // United States
  'us': 'United States',
  'usa': 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  'united states': 'United States',
  'united states of america': 'United States',
  '미국': 'United States',
  // United Kingdom
  'uk': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'great britain': 'United Kingdom',
  'britain': 'United Kingdom',
  'united kingdom': 'United Kingdom',
  '영국': 'United Kingdom',
  // South Korea
  'korea': 'South Korea',
  'south korea': 'South Korea',
  '한국': 'South Korea',
  '대한민국': 'South Korea',
  // 한글 표기 → 영문 표준
  '프랑스': 'France',
  '이탈리아': 'Italy',
  '스페인': 'Spain',
  '독일': 'Germany',
  '호주': 'Australia',
  '칠레': 'Chile',
  '아르헨티나': 'Argentina',
  '포르투갈': 'Portugal',
  '오스트리아': 'Austria',
  '뉴질랜드': 'New Zealand',
  '남아프리카': 'South Africa',
  '그리스': 'Greece',
  '일본': 'Japan',
}

export const COUNTRY_FLAG: Record<string, string> = {
  'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Germany': '🇩🇪',
  'USA': '🇺🇸', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧',
  'Australia': '🇦🇺', 'Chile': '🇨🇱', 'Argentina': '🇦🇷', 'Portugal': '🇵🇹',
  'Austria': '🇦🇹', 'New Zealand': '🇳🇿', 'South Africa': '🇿🇦',
  'Greece': '🇬🇷', 'Hungary': '🇭🇺', 'Romania': '🇷🇴',
  'Bulgaria': '🇧🇬', 'Croatia': '🇭🇷', 'Slovenia': '🇸🇮', 'Georgia': '🇬🇪',
  'Lebanon': '🇱🇧', 'Israel': '🇮🇱', 'Japan': '🇯🇵', 'China': '🇨🇳',
  'South Korea': '🇰🇷',
  // 한글 키 (정규화 전 lookup용)
  '프랑스': '🇫🇷', '이탈리아': '🇮🇹', '스페인': '🇪🇸', '독일': '🇩🇪',
  '미국': '🇺🇸', '호주': '🇦🇺', '칠레': '🇨🇱', '아르헨티나': '🇦🇷',
  '포르투갈': '🇵🇹', '오스트리아': '🇦🇹', '뉴질랜드': '🇳🇿', '남아프리카': '🇿🇦',
  '그리스': '🇬🇷', '일본': '🇯🇵', '한국': '🇰🇷',
}

export function normalizeCountry(name?: string): string {
  if (!name) return ''
  const key = name.trim().toLowerCase()
  return COUNTRY_ALIASES[key] || COUNTRY_ALIASES[name.trim()] || name.trim()
}

export function countryWithFlag(name: string) {
  return `${COUNTRY_FLAG[name] || '🍾'} ${name}`
}
