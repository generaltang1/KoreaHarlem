-- tips 버킷 파일당 한도 1GB로 상향
-- Supabase SQL Editor에서 실행하세요
--
-- 주의:
-- - Free 플랜: 전역 파일 한도 최대 50MB → 1GB 업로드 불가
-- - Pro 이상: Dashboard → Storage → Settings에서 Global file size limit을 1GB 이상으로 올린 뒤 적용

update storage.buckets
set file_size_limit = 1073741824
where id = 'tips';
