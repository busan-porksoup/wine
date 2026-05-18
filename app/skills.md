# Skills

## OCR / Wine Label Recognition Skill

### 언제 필요한가
- 사용자가 와인 사진을 업로드했을 때
- Claude Vision API로 라벨 텍스트 인식이 필요할 때
- 이미지에서 와인 정보(이름, 생산자, 빈티지 등)를 추출할 때

### 사용 방법
1. 이미지를 base64로 변환
2. `app/actions.ts`의 `recognizeWineLabel()` 함수 호출
3. 반환된 JSON 데이터로 폼 자동 입력

### 필요한 환경변수
- `ANTHROPIC_API_KEY` — Anthropic Console에서 발급

### 모델
- `(process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6') as string`

### 입력
- imageBase64: string (base64 인코딩된 이미지)
- mediaType: string (예: image/jpeg, image/png)

### 출력
```json
{
  "name": "와인 이름",
  "producer": "생산자",
  "country": "국가",
  "region": "지역",
  "grape_variety": "품종",
  "vintage_year": 2021,
  "wine_type": "white"
}
```

### 에러 처리
- 인식 실패 시 사용자에게 수동 입력 안내
- API 키 없을 시 오류 메시지 표시