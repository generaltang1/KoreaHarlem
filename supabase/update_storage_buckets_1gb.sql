-- audio / images 버킷 파일당 한도 1GB로 상향
-- Supabase SQL Editor에서 실행하세요
--
-- tips 버킷: 제보하기(이미지·동영상) 전용 — 이미 1GB면 그대로 유지
-- audio: 앨범 음원 등
-- images: 상품·아티스트·커버 이미지 등
--
-- Pro 플랜: Dashboard → Storage → Settings 의 Global file size limit도
-- 1GB 이상으로 올려야 버킷 한도가 실제로 적용됩니다.

update storage.buckets
set file_size_limit = 1073741824
where id in ('audio', 'images', 'tips');
