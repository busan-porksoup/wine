/**
 * 와인 테이스팅 노트 표준 어휘 사전 (v3 — 클린 재구성)
 *
 * 기반:
 *  - WSET SAT (Systematic Approach to Tasting)
 *  - UC Davis Wine Aroma Wheel
 *  - 귀스타브, 와인 시음을 배우다 (한국어 와인 교재)
 *  - 실제 DB의 tasting_tags 빈도 (50개 와인)
 *
 * 카테고리 (8):
 *  1. 과일
 *  2. 꽃·허브·식물
 *  3. 향신료
 *  4. 과자·오크·발효·구운
 *  5. 숲·흙·동물·광물
 *  6. 구조
 *  7. 질감
 *  8. 여운·종합
 *
 * Umbrella (11):
 *  시트러스, 붉은 과일, 검은 과일, 견과류, 건과일,
 *  흰꽃, 붉은꽃, 푸른꽃, 허브,
 *  산도, 탄닌감
 *
 * API:
 *  - normalizeNote(tag) → canonical
 *  - categorizeNote(tag) → 카테고리 한글명
 *  - isUmbrellaTag(tag) → boolean
 *  - expandTag(tag) → Set<canonical> (umbrella 확장)
 *  - wineMatchesFilterTag(wineTags, filterTag) → 매칭 여부
 *  - ALL_CANONICAL_TAGS → AI 프롬프트 controlled vocabulary
 */

export type NoteEntry = {
  ko: string           // canonical (정규형)
  en?: string          // 영어 표준 표기 (참고용)
  synonyms?: string[]  // 같은 의미의 다른 한국어 표현
  includes?: string[]  // umbrella entry — 자식 canonical 태그 배열
}

export type NoteCategory = {
  id: string
  name_ko: string
  description?: string
  tags: NoteEntry[]
}

// ─────────────────────────────────────────────
// 사전 본체
// ─────────────────────────────────────────────

export const NOTES_VOCABULARY: NoteCategory[] = [

  // 1 ─────────────────────────────────────────
  {
    id: 'fruit',
    name_ko: '과일',
    description: '감귤·붉은·검은·하얀·노란·열대 과일, 견과류, 절인 과일, 젤리',
    tags: [
      // 감귤류
      { ko: '베르가못',   en: 'bergamot' },
      { ko: '레몬',       en: 'lemon',      synonyms: ['레몬향', '레몬껍질', '레몬필'] },
      { ko: '라임',       en: 'lime',       synonyms: ['라임껍질', '라임필'] },
      { ko: '귤',         en: 'mandarin',   synonyms: ['만다린'] },
      { ko: '오렌지',     en: 'orange',     synonyms: ['오렌지향', '오렌지껍질'] },
      { ko: '자몽',       en: 'grapefruit' },
      { ko: '유자',       en: 'yuzu' },
      { ko: '시트러스',   en: 'citrus',     synonyms: ['감귤', '감귤류'],
        includes: ['베르가못', '레몬', '라임', '귤', '오렌지', '자몽', '유자'] },

      // 붉은 과일
      { ko: '체리',       en: 'cherry',     synonyms: ['체리향', '체리맛'] },
      { ko: '딸기',       en: 'strawberry' },
      { ko: '산딸기',     en: 'raspberry',  synonyms: ['라즈베리', '복분자'] },
      { ko: '구즈베리',   en: 'gooseberry' },
      { ko: '석류',       en: 'pomegranate' },
      { ko: '붉은 과일',  en: 'red fruit',  synonyms: ['붉은과일'],
        includes: ['체리', '딸기', '산딸기', '구즈베리', '석류'] },

      // 검은 과일
      { ko: '카시스',     en: 'blackcurrant', synonyms: ['블랙커런트', '카시스향'] },
      { ko: '블랙체리',   en: 'black cherry', synonyms: ['검은체리', '다크체리'] },
      { ko: '무화과',     en: 'fig' },
      { ko: '블랙베리',   en: 'blackberry',   synonyms: ['블랙베리향'] },
      { ko: '블루베리',   en: 'blueberry' },
      { ko: '검은 과일',  en: 'black fruit',  synonyms: ['검은과일'],
        includes: ['카시스', '블랙체리', '무화과', '블랙베리', '블루베리'] },

      // 열대 과일
      { ko: '파인애플',   en: 'pineapple' },
      { ko: '바나나',     en: 'banana' },
      { ko: '패션프루트', en: 'passion fruit', synonyms: ['패션후르츠'] },
      { ko: '리치',       en: 'lychee' },
      { ko: '망고',       en: 'mango' },
      { ko: '멜론',       en: 'melon' },

      // 하얀·노란 과수 과일
      { ko: '사과',       en: 'apple',     synonyms: ['청사과', '풋사과', '녹색사과', '녹사과'] },
      { ko: '배',         en: 'pear' },
      { ko: '백도',       en: 'white peach' },
      { ko: '복숭아',     en: 'peach',     synonyms: ['황도'] },
      { ko: '천도복숭아', en: 'nectarine' },
      { ko: '살구',       en: 'apricot',   synonyms: ['아프리콧'] },
      { ko: '자두',       en: 'plum',      synonyms: ['푸룬'] },
      { ko: '미라벨자두', en: 'mirabelle plum' },
      { ko: '모과',       en: 'quince' },

      // 견과류
      { ko: '아몬드',     en: 'almond',    synonyms: ['생아몬드'] },
      { ko: '헤이즐넛',   en: 'hazelnut' },
      { ko: '호두',       en: 'walnut' },
      { ko: '캐슈넛',     en: 'cashew' },
      { ko: '피스타치오', en: 'pistachio' },
      { ko: '견과류',     en: 'nuts',
        includes: ['아몬드', '헤이즐넛', '호두', '캐슈넛', '피스타치오'] },

      // 건과일·말린
      { ko: '건포도',     en: 'raisin',    synonyms: ['말린포도'] },
      { ko: '말린무화과', en: 'dried fig' },
      { ko: '말린자두',   en: 'prune' },
      { ko: '대추야자',   en: 'date' },
      { ko: '건과일',     en: 'dried fruit',
        includes: ['건포도', '말린무화과', '말린자두', '대추야자'] },

      // 잼·익힌
      { ko: '콩포트',     en: 'compote' },
      { ko: '잼',         en: 'jam',       synonyms: ['잼맛', '잼처럼', '잼같은', '졸인과일', '딸기잼', '끈적함'] },
      { ko: '익힌과일',   en: 'cooked fruit', synonyms: ['졸인'] },
      { ko: '모과젤리',   en: 'quince jelly' },
      { ko: '젤리',       en: 'jelly' },
      { ko: '마시멜로',   en: 'marshmallow' },

      // 일반
      { ko: '과일향',     en: 'fruity',    synonyms: ['과일'] },
    ],
  },

  // 2 ─────────────────────────────────────────
  {
    id: 'floral_herbal_plant',
    name_ko: '꽃·허브·식물',
    description: '꽃, 허브, 신선한 풀·말린 식물, 꿀',
    tags: [
      // 꽃 — 흰색 계열
      { ko: '아카시아',   en: 'acacia' },
      { ko: '산사나무',   en: 'hawthorn' },
      { ko: '캐모마일',   en: 'chamomile' },
      { ko: '인동초',     en: 'honeysuckle' },
      { ko: '오렌지꽃',   en: 'orange blossom', synonyms: ['오렌지블로섬'] },
      { ko: '꽃무',       en: 'wallflower' },
      { ko: '자스민',     en: 'jasmine',    synonyms: ['재스민'] },
      { ko: '엘더플라워', en: 'elderflower', synonyms: ['딱총나무꽃'] },
      { ko: '흰꽃',       en: 'white flower', synonyms: ['화이트플라워', '흰 꽃'],
        includes: ['아카시아', '산사나무', '캐모마일', '인동초', '오렌지꽃', '꽃무', '자스민', '엘더플라워'] },

      // 꽃 — 붉은 계열
      { ko: '장미',       en: 'rose',      synonyms: ['장미향', '장미꽃'] },
      { ko: '카네이션',   en: 'carnation' },
      { ko: '모란',       en: 'peony' },
      { ko: '붉은꽃',     en: 'red flower', synonyms: ['붉은 꽃'],
        includes: ['장미', '카네이션', '모란'] },

      // 꽃 — 푸른 계열
      { ko: '라일락',     en: 'lilac' },
      { ko: '바이올렛',   en: 'violet',    synonyms: ['제비꽃'] },
      { ko: '아이리스',   en: 'iris' },
      { ko: '푸른꽃',     en: 'purple flower', synonyms: ['보라꽃', '푸른 꽃', '파란꽃'],
        includes: ['라일락', '바이올렛', '아이리스'] },

      // 꿀·꽃 일반
      { ko: '꿀',         en: 'honey',     synonyms: ['꿀향', '꿀맛', '꿀의향'] },
      { ko: '꽃향',       en: 'floral',    synonyms: ['꽃향기'] },

      // 허브
      { ko: '민트',       en: 'mint',      synonyms: ['박하', '민트향'] },
      { ko: '바질',       en: 'basil' },
      { ko: '타임',       en: 'thyme' },
      { ko: '로즈마리',   en: 'rosemary' },
      { ko: '라벤더',     en: 'lavender' },
      { ko: '솔잎',       en: 'pine needle', synonyms: ['소나무', '솔향'] },
      { ko: '유칼립투스', en: 'eucalyptus' },
      { ko: '시트로넬라', en: 'citronella' },
      { ko: '펜넬',       en: 'fennel' },
      { ko: '차나무',     en: 'tea plant' },
      { ko: '버베나',     en: 'verbena' },
      { ko: '보리수나무', en: 'linden' },
      { ko: '허브',       en: 'herb',      synonyms: ['허브향'],
        includes: ['민트', '바질', '타임', '로즈마리', '라벤더', '솔잎', '유칼립투스', '시트로넬라', '펜넬', '차나무', '버베나'] },

      // 기타 식물
      { ko: '신선한풀',   en: 'fresh grass', synonyms: ['풀잎', '풀', '풀향', '청초함'] },
      { ko: '건초',       en: 'hay',       synonyms: ['말린풀'] },
      { ko: '고사리',     en: 'fern' },
      { ko: '파프리카',   en: 'green bell pepper', synonyms: ['피망', '풋피망', '청피망'] },
      { ko: '딱총나무',   en: 'elder' },
      { ko: '담배',       en: 'tobacco',   synonyms: ['담뱃잎', '담배향'] },
      { ko: '토마토잎',   en: 'tomato leaf' },
      { ko: '수풀',       en: 'brush' },
    ],
  },

  // 3 ─────────────────────────────────────────
  {
    id: 'spice',
    name_ko: '향신료',
    description: '후추·계피·정향·바닐라·사프란 등',
    tags: [
      { ko: '검은후추',   en: 'black pepper', synonyms: ['후추', '후추향'] },
      { ko: '흰후추',     en: 'white pepper' },
      { ko: '핑크페퍼',   en: 'pink pepper' },
      { ko: '정향',       en: 'clove' },
      { ko: '시나몬',     en: 'cinnamon',  synonyms: ['계피'] },
      { ko: '카다멈',     en: 'cardamom' },
      { ko: '너트맥',     en: 'nutmeg',    synonyms: ['육두구'] },
      { ko: '아니스',     en: 'anise' },
      { ko: '감초',       en: 'licorice',  synonyms: ['리코리스'] },
      { ko: '생강',       en: 'ginger' },
      { ko: '고수',       en: 'coriander', synonyms: ['실란트로'] },
      { ko: '카레',       en: 'curry' },
      { ko: '월계수',     en: 'bay leaf' },
      { ko: '바닐라',     en: 'vanilla',   synonyms: ['바닐라향'] },
      { ko: '사프란',     en: 'saffron' },
      { ko: '파프리카가루', en: 'paprika powder' },
      { ko: '스파이시',   en: 'spicy',     synonyms: ['향신료감', '매운향', '스파이스', '향신료'] },
    ],
  },

  // 4 ─────────────────────────────────────────
  {
    id: 'pastry_oak_roasted',
    name_ko: '과자·오크·발효·구운',
    description: '양조 흔적 — MLF·효모(과자), 오크 숙성(나무), 구운향·탄내·볶은향',
    tags: [
      // 과자·발효 (MLF, autolysis)
      { ko: '버터',       en: 'butter',    synonyms: ['버터향'] },
      { ko: '비스킷',     en: 'biscuit' },
      { ko: '브리오슈',   en: 'brioche' },
      { ko: '커스터드크림', en: 'custard cream' },
      { ko: '생크림',     en: 'whipped cream', synonyms: ['크림', '크리미', '크림향', '크림질감'] },
      { ko: '우유',       en: 'milk' },
      { ko: '효모',       en: 'yeast',     synonyms: ['이스트'] },
      { ko: '식빵',       en: 'bread',     synonyms: ['빵', '갓구운빵', '빵향'] },
      { ko: '타르트',     en: 'tart' },
      { ko: '아몬드페이스트', en: 'almond paste' },
      { ko: '요거트',     en: 'yogurt' },
      { ko: '치즈',       en: 'cheese' },

      // 나무·오크
      { ko: '발사나무',   en: 'balsa wood' },
      { ko: '목재',       en: 'lumber' },
      { ko: '서양삼나무', en: 'cedar',     synonyms: ['시더', '삼나무', '시더향'] },
      { ko: '참나무',     en: 'oak',       synonyms: ['오크', '오크향'] },
      { ko: '코코넛',     en: 'coconut' },
      { ko: '파출리',     en: 'patchouli' },
      { ko: '나무진',     en: 'tree resin', synonyms: ['수지'] },
      { ko: '샌들우드',   en: 'sandalwood', synonyms: ['단향'] },

      // 구운향·탄내·볶은향 (= 화독내)
      { ko: '카카오',     en: 'cacao' },
      { ko: '커피',       en: 'coffee',    synonyms: ['에스프레소'] },
      { ko: '캐러멜',     en: 'caramel' },
      { ko: '초콜릿',     en: 'chocolate', synonyms: ['다크초콜릿'] },
      { ko: '연기',       en: 'smoke',     synonyms: ['스모키', '훈제', '연기향'] },
      { ko: '타르',       en: 'tar' },
      { ko: '모카',       en: 'mocha' },
      { ko: '토스트',     en: 'toast',     synonyms: ['구운', '토스티'] },
      { ko: '프랄린',     en: 'praline' },
    ],
  },

  // 5 ─────────────────────────────────────────
  {
    id: 'forest_earth_animal_mineral',
    name_ko: '숲·흙·동물·광물',
    description: '테루아 + 병 숙성 — 숲속향, 흙, 동물성, 미네랄',
    tags: [
      // 숲속
      { ko: '양송이',     en: 'mushroom',  synonyms: ['버섯'] },
      { ko: '낙엽',       en: 'fallen leaves' },
      { ko: '살구버섯',   en: 'chanterelle' },
      { ko: '부엽토',     en: 'forest floor', synonyms: ['부식토', '흙냄새'] },
      { ko: '이끼',       en: 'moss' },
      { ko: '흙',         en: 'earth',     synonyms: ['흙내음'] },
      { ko: '트러플',     en: 'truffle',   synonyms: ['송로버섯'] },

      // 동물
      { ko: '호박',       en: 'amber' },
      { ko: '밀랍',       en: 'beeswax' },
      { ko: '사향고양이', en: 'civet' },
      { ko: '가죽',       en: 'leather',   synonyms: ['가죽향'] },
      { ko: '털',         en: 'fur' },
      { ko: '들짐승',     en: 'gamy',      synonyms: ['게임고기', '야생고기', '야생'] },
      { ko: '육즙',       en: 'meat juice' },
      { ko: '무스크',     en: 'musk',      synonyms: ['머스크'] },

      // 광물
      { ko: '백악',       en: 'chalk',     synonyms: ['분필'] },
      { ko: '자갈',       en: 'pebble' },
      { ko: '석유',       en: 'petroleum', synonyms: ['페트롤', '석유향', '석유원유'] },
      { ko: '요오드',     en: 'iodine' },
      { ko: '화약',       en: 'gunpowder', synonyms: ['화약내', '불꽃놀이'] },
      { ko: '규석',       en: 'silica' },
      { ko: '미네랄',     en: 'mineral',   synonyms: ['미네랄리티', '미네랄감'] },
      { ko: '흑연',       en: 'graphite',  synonyms: ['연필심'] },
      { ko: '부싯돌',     en: 'flint',     synonyms: ['플린트', '플린트향'] },
      { ko: '점토',       en: 'clay' },
      { ko: '석회',       en: 'limestone', synonyms: ['석회암'] },
      { ko: '젖은돌',     en: 'wet stone', synonyms: ['젖은바위'] },
      { ko: '짠맛',       en: 'saline',    synonyms: ['염도', '바닷내', '소금기', '바다향', '짭짤함'] },
    ],
  },

  // 6 ─────────────────────────────────────────
  {
    id: 'structure',
    name_ko: '구조',
    description: '탄닌·산도·바디·단맛·알코올·거품',
    tags: [
      // 탄닌 — 탄닌감이 umbrella
      { ko: '탄닌감',     en: 'tannin',    synonyms: ['탄닌', '탄닌이 강한', '탄닉', '강한탄닌'],
        includes: ['부드러운 탄닌', '거친 탄닌', '잘 짜인 탄닌'] },
      { ko: '부드러운 탄닌', en: 'smooth tannin', synonyms: ['실키한 탄닌', '섬세한탄닌', '가벼운 탄닌'] },
      { ko: '거친 탄닌',   en: 'rough tannin',     synonyms: ['터프한 탄닌'] },
      { ko: '잘 짜인 탄닌', en: 'well-structured tannin', synonyms: ['짜임새 있는'] },

      // 산도 — 산도가 umbrella
      { ko: '산도',       en: 'acidity',   synonyms: ['신맛', '애시드', '산미', '적당한산도'],
        includes: ['높은 산도', '낮은 산도', '활발한 산도', '크리스프'] },
      { ko: '높은 산도',   en: 'high acidity',   synonyms: ['톡쏘는 산도', '강한 산도', '높은산도', '생생한산도'] },
      { ko: '낮은 산도',   en: 'low acidity',    synonyms: ['둥근 산도'] },
      { ko: '활발한 산도', en: 'lively acidity', synonyms: ['생기있는 산도', '밝은산도', '밝은 산도', '상쾌한 산도', '상큼한 산도'] },
      { ko: '크리스프',   en: 'crisp',     synonyms: ['크리스피', '상쾌함', '상큼함'] },

      // 바디
      { ko: '풀바디',     en: 'full body',   synonyms: ['풀바디감', '묵직한', '풀바디한'] },
      { ko: '미디엄바디', en: 'medium body', synonyms: ['미디엄', '중간바디'] },
      { ko: '가벼운바디', en: 'light body',  synonyms: ['라이트바디', '라이트한', '가벼운', '경쾌한', '가벼움'] },

      // 단맛
      { ko: '드라이',     en: 'dry',       synonyms: ['드라이한', '단맛 없는'] },
      { ko: '오프드라이', en: 'off-dry' },
      { ko: '미디엄단맛', en: 'medium sweet' },
      { ko: '스위트',     en: 'sweet',     synonyms: ['단맛', '당도', '달콤함'] },
      { ko: '잔당감',     en: 'residual sugar' },

      // 알코올
      { ko: '알코올감',   en: 'alcohol',   synonyms: ['알코올'] },
      { ko: '강한 알코올', en: 'high alcohol', synonyms: ['알코올 도수 높은'] },

      // 거품 (스파클링)
      { ko: '거품',       en: 'bubbles',   synonyms: ['기포', '기포감'] },
      { ko: '섬세한 거품', en: 'fine bubbles', synonyms: ['섬세한거품', '세밀한 거품', '세밀한거품'] },
    ],
  },

  // 7 ─────────────────────────────────────────
  {
    id: 'texture',
    name_ko: '질감',
    description: 'Mouthfeel — 입안의 촉감',
    tags: [
      { ko: '실키',       en: 'silky',     synonyms: ['실키함', '실키한', '비단같은', '실크질감'] },
      { ko: '벨벳',       en: 'velvety',   synonyms: ['벨벳같은', '벨베티'] },
      { ko: '크리미',     en: 'creamy',    synonyms: ['크리미한', '크림같은'] },
      { ko: '부드러움',   en: 'smooth',    synonyms: ['부드러운', '매끄러운'] },
      { ko: '거침',       en: 'rough',     synonyms: ['거친', '거칠음'] },
      { ko: '응축감',     en: 'concentrated', synonyms: ['농축감', '농밀한', '응축된'] },
      { ko: '기름진',     en: 'oily',      synonyms: ['오일리'] },
      { ko: '시원함',     en: 'cooling',   synonyms: ['청량감', '쿨링'] },
      { ko: '쫀쫀함',     en: 'grippy',    synonyms: ['그리피', '쪼이는', '압착감'] },
      { ko: '풍성함',     en: 'lush',      synonyms: ['풍성한', '러쉬'] },
    ],
  },

  // 8 ─────────────────────────────────────────
  {
    id: 'finish_overall',
    name_ko: '여운·종합',
    description: '마무리(Finish)와 전체 인상(Overall)',
    tags: [
      // 여운
      { ko: '긴 여운',   en: 'long finish',   synonyms: ['긴 후미', '긴 마무리', '긴여운'] },
      { ko: '짧은 여운', en: 'short finish',  synonyms: ['짧은여운'] },
      { ko: '깔끔한 여운', en: 'clean finish', synonyms: ['깔끔한 마무리', '클린한 마무리', '깔끔함', '깔끔한여운', '클린'] },
      { ko: '복합적 여운', en: 'complex finish' },

      // 종합 인상
      { ko: '복합적',     en: 'complex',   synonyms: ['복합미', '복합성', '여러 층'] },
      { ko: '단순한',     en: 'simple',    synonyms: ['단조로운'] },
      { ko: '우아함',     en: 'elegant',   synonyms: ['우아한', '엘레강스', '엘레강트'] },
      { ko: '강건함',     en: 'powerful',  synonyms: ['강건한', '파워풀', '힘있는'] },
      { ko: '균형',       en: 'balanced',  synonyms: ['균형감', '균형잡힌', '밸런스'] },
      { ko: '신선함',     en: 'fresh',     synonyms: ['신선한', '프레시', '프레시한', '산뜻함'] },
      { ko: '깊이감',     en: 'deep',      synonyms: ['깊이', '깊은'] },
      { ko: '조화로움',   en: 'harmonious', synonyms: ['조화로운', '조화'] },
      { ko: '모던',       en: 'modern',    synonyms: ['모던한'] },
      { ko: '클래식',     en: 'classic',   synonyms: ['클래식한', '고전적'] },
      { ko: '섬세함',     en: 'delicate',  synonyms: ['섬세한', 'delicate', '파인'] },
    ],
  },
]

// ─────────────────────────────────────────────
// 헬퍼 — synonym/canonical/카테고리 변환
// ─────────────────────────────────────────────

// 모든 동의어 → canonical 매핑 (역방향 인덱스)
export const SYNONYM_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const cat of NOTES_VOCABULARY) {
    for (const tag of cat.tags) {
      map[tag.ko] = tag.ko
      ;(tag.synonyms || []).forEach(s => { map[s] = tag.ko })
    }
  }
  return map
})()

// canonical에서 entry 찾기
function findEntry(canonical: string): NoteEntry | null {
  for (const cat of NOTES_VOCABULARY) {
    const e = cat.tags.find(t => t.ko === canonical)
    if (e) return e
  }
  return null
}

/** 임의 입력을 canonical로 변환 (synonym → canonical). 없으면 원본 trim */
export function normalizeNote(tag: string): string {
  if (!tag) return tag
  return SYNONYM_MAP[tag.trim()] || tag.trim()
}

/** 태그가 속한 카테고리 id (없으면 null) */
export function categorizeNoteById(tag: string): string | null {
  const canonical = normalizeNote(tag)
  for (const cat of NOTES_VOCABULARY) {
    if (cat.tags.some(t => t.ko === canonical)) return cat.id
  }
  return null
}

/** 태그가 속한 카테고리 한글명 (없으면 '기타') */
export function categorizeNote(tag: string): string {
  const id = categorizeNoteById(tag)
  if (!id) return '기타'
  return NOTES_VOCABULARY.find(c => c.id === id)?.name_ko ?? '기타'
}

/** 해당 canonical 태그가 umbrella (자식 includes 보유) 인지 */
export function isUmbrellaTag(tag: string): boolean {
  const entry = findEntry(normalizeNote(tag))
  return !!(entry?.includes && entry.includes.length > 0)
}

/**
 * umbrella expansion — 필터 매칭에 사용.
 * 입력이 umbrella면 자식 태그까지 포함한 Set 반환.
 * 입력이 specific이면 자기 자신만 포함.
 */
export function expandTag(tag: string): Set<string> {
  const canonical = normalizeNote(tag)
  const result = new Set<string>([canonical])
  const entry = findEntry(canonical)
  if (entry?.includes) {
    entry.includes.forEach(inc => result.add(inc))
  }
  return result
}

/** 와인 태그 배열에서 필터 태그와 매칭되는지 검사 (umbrella 확장 적용) */
export function wineMatchesFilterTag(wineTags: string[], filterTag: string): boolean {
  const expanded = expandTag(filterTag)
  for (const wt of wineTags) {
    if (expanded.has(normalizeNote(wt))) return true
  }
  return false
}

// 모든 canonical 태그 (AI 프롬프트 controlled vocabulary용)
export const ALL_CANONICAL_TAGS: string[] = NOTES_VOCABULARY.flatMap(c => c.tags.map(t => t.ko))
