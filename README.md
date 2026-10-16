# bergwerk-media
베르크서울 상품 영상·포스터 (jsDelivr CDN 호스팅용). H.264 · 무음 · 기본은 **원본 표시 비율 유지**입니다. 사용자 요청이 없으면 2:3·3:4로 강제 변환하지 않습니다.

## 신규 업로드 저장소

**2026-10-16 00:00 KST부터 신규 업로드는 [`bergwerk-media-2`](https://github.com/seoraksanredcrayfish/bergwerk-media-2)를 사용합니다.** 촬영일이 아니라 업로드 시점 기준입니다.

- 이 저장소의 기존 영상·포스터와 CDN URL은 그대로 유지합니다. 파일 이동·복사나 기존 상품 링크의 일괄 변경은 하지 않습니다.
- 기존 영상의 교체·재인코딩·재시도는 원래 저장소와 경로를 사용합니다.
- 신규 저장소도 기존 `media-upload` 절차를 사용합니다. 저장소 변수 `MEDIA_REPO`, `MEDIA_BRANCH`, `MEDIA_CDN_BASE`는 각각 `ops.media_repo.repo`, `branch`, `cdn_base`를 가리킵니다.
- 신규 베르크 설정은 `repo=seoraksanredcrayfish/bergwerk-media-2`, `branch=main`, `cdn_base=https://cdn.jsdelivr.net/gh/seoraksanredcrayfish/bergwerk-media-2@main/`입니다. 다른 몰 설정·기존 자산 URL·파일 크기 한도는 변경하지 않습니다.
- 배너·웹 그래픽은 [`bergwerk-web-assets`](https://github.com/seoraksanredcrayfish/bergwerk-web-assets)를 사용합니다.
