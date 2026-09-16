#!/bin/bash
# 화면 캡처 파이프라인 — 헤드리스 Chrome 으로 docs/img/pc/*.png 를 갱신한다.
# 사용: BASE=http://localhost:5175 bash techdoc/capture.sh [화면ID ...]
# 인자 없으면 아래 전체 목록. ?capture=1 로 DevBar·시연계정이 숨는다.
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE="${BASE:-http://localhost:5175}"
OUT="docs/img/pc"

# 화면ID|경로|세로(px, 생략 시 700)  (RECEIVED=B4N9R2 · IN_PROGRESS=A7K2Q9 시드 기준)
# 긴 폼(U-02, U-07)은 하단 버튼까지 담기게 뷰포트를 늘린다 — 덱·문서는 비율에 맞춰 fit 된다.
SHOTS=(
  "U-01|/?capture=1"
  "U-02|/report?capture=1|1180"
  "U-03|/report/M-260915-G3T7Y4/done?capture=1"
  "U-04|/lookup?capture=1"
  "U-05|/complaints/M-260915-B4N9R2?capture=1"
  "U-06|/complaints/M-260915-B4N9R2?capture=1&modal=pw"
  "U-07|/complaints/M-260915-B4N9R2/edit?capture=1&modal=edit|1080"
  "W-01|/staff/login?capture=1"
  "E-02|/complaints/M-260915-A7K2Q9?capture=1"
  "E-03|/complaints/M-260915-B4N9R2?capture=1&modal=cancel"
  # 직원 화면 — ?devrole= 로 로그인 우회 (WORKER=W001 김도현)
  "W-02|/worker?capture=1&devrole=WORKER|1060"
  "W-03|/worker/complaints/M-260915-C9M4T7?capture=1&devrole=WORKER"
  "W-04|/worker/complaints/M-260915-C9M4T7?capture=1&devrole=WORKER&modal=offcat"
  "W-05|/worker/tasks?capture=1&devrole=WORKER"
  "W-06|/worker/complaints/M-260915-A7K2Q9/complete?capture=1&devrole=WORKER"
  "E-01|/worker/complaints/M-260915-C9M4T7?capture=1&devrole=WORKER&modal=conflict"
  "E-04|/worker/complaints/M-260915-A7K2Q9/complete?capture=1&devrole=WORKER&modal=release"
  "A-01|/admin?capture=1&devrole=ADMIN|880"
  "A-02|/admin/complaints?capture=1&devrole=ADMIN|1150"
  "A-03|/admin/complaints/M-260915-A7K2Q9?capture=1&devrole=ADMIN|860"
  "A-04|/admin/complaints/M-260915-C9M4T7?capture=1&devrole=ADMIN&modal=assign"
  # 배정 회수 확인: /admin/complaints/M-260915-A7K2Q9?devrole=ADMIN&modal=revoke
  "A-05|/admin/complaints/M-260915-B4N9R2/reject?capture=1&devrole=ADMIN|820"
  "A-06|/admin/stats?capture=1&devrole=ADMIN|800"
)

for entry in "${SHOTS[@]}"; do
  IFS='|' read -r id path h <<< "$entry"
  h="${h:-700}"
  if [ $# -gt 0 ]; then case " $* " in *" $id "*) ;; *) continue ;; esac; fi
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size="1440,$h" \
    --virtual-time-budget=4500 \
    --screenshot="$OUT/$id.png" "$BASE$path" >/dev/null 2>&1
  echo "captured $id (1440x$h)"
done
