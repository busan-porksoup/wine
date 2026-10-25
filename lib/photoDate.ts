import exifr from 'exifr'

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 사진 찍은 날짜(EXIF DateTimeOriginal) → YYYY-MM-DD.
// EXIF가 없으면 파일 수정일로 대체 — 폰 브라우저는 업로드 시각을 넣는 경우가 많아 오늘 날짜가 될 수 있음
export async function photoDate(file: File): Promise<string> {
  try {
    const tags = await exifr.parse(await file.arrayBuffer(), ['DateTimeOriginal', 'CreateDate'])
    const d = tags?.DateTimeOriginal ?? tags?.CreateDate
    if (d instanceof Date && !isNaN(d.getTime())) return ymd(d)
  } catch {}
  return ymd(new Date(file.lastModified))
}
