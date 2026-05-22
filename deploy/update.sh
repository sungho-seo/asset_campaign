#!/usr/bin/env bash
# 워킹 샘플 업데이트 스크립트
# 사용: bash deploy/update.sh  (또는 ./deploy/update.sh)
#
# 환경변수 (선택):
#   PORT       서비스 포트 (기본 8049)
#   BRANCH     pull 받을 브랜치 (기본 claude/gifted-ritchie-Kn0PX)
#   SKIP_PULL  1로 지정하면 git pull 생략 (이미 받아둔 상태에서 재배포)

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

PORT="${PORT:-8049}"
BRANCH="${BRANCH:-claude/gifted-ritchie-Kn0PX}"
SKIP_PULL="${SKIP_PULL:-0}"

# 스크립트가 deploy/ 안에서 호출되든 repo root에서 호출되든 정상 동작하도록
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"
cd "$SOURCE_DIR"

printf "${GREEN}▶ 작업 폴더${NC}  $SOURCE_DIR\n"
printf "${GREEN}▶ 브랜치${NC}    $BRANCH\n"
printf "${GREEN}▶ 포트${NC}      $PORT\n"
echo ""

if [[ "$SKIP_PULL" != "1" ]]; then
  printf "${GREEN}[1/5]${NC} 코드 최신화\n"
  # package-lock.json 로컬 변경 자동 폐기 (npm install 결과 충돌 방지)
  if [[ -f package-lock.json ]]; then
    git checkout -- package-lock.json 2>/dev/null || true
  fi
  git pull origin "$BRANCH"
  echo ""
else
  printf "${YELLOW}[1/5] git pull 생략 (SKIP_PULL=1)${NC}\n\n"
fi

printf "${GREEN}[2/5]${NC} 의존성 동기화\n"
npm install --no-audit --no-fund
echo ""

printf "${GREEN}[3/5]${NC} 프로덕션 빌드\n"
npm run build
chunk_count=$(ls dist/assets/*.js 2>/dev/null | wc -l)
printf "       ${DIM}→ $chunk_count 개 JS 청크 생성${NC}\n"
if [[ $chunk_count -lt 3 ]]; then
  printf "${RED}       경고: 청크가 너무 적습니다. 코드 스플리팅 누락 가능성${NC}\n"
fi
echo ""

printf "${GREEN}[4/5]${NC} 운영 디렉토리 배포 ${DIM}(sudo 권한 필요)${NC}\n"
sudo LOCAL_SOURCE="$SOURCE_DIR" PORT="$PORT" bash deploy/install.sh
echo ""

printf "${GREEN}[5/5]${NC} 서비스 검증\n"
sleep 2

# 서비스 상태
if sudo systemctl is-active --quiet asset-campaign; then
  printf "       ${GREEN}● asset-campaign 정상 동작 중${NC}\n"
else
  printf "       ${RED}● asset-campaign 비정상${NC}\n"
  sudo journalctl -u asset-campaign -n 20 --no-pager
  exit 1
fi

# 헬스체크
sleep 1
if health=$(curl -sS --max-time 3 "http://localhost:$PORT/api/health"); then
  printf "       ${GREEN}✓ 헬스체크 통과${NC}  ${DIM}$health${NC}\n"
else
  printf "       ${RED}✗ 헬스체크 실패 — 로그 확인:${NC} sudo journalctl -u asset-campaign -n 30\n"
  exit 1
fi

ip=$(hostname -I | awk '{print $1}')
echo ""
printf "${GREEN}═══════════════════════════════════════════════════${NC}\n"
printf "${GREEN}  배포 완료${NC}\n"
echo "  → 접속:    http://$ip:$PORT"
echo "  → 로그:    sudo journalctl -u asset-campaign -f"
echo "  → 재시작:  sudo systemctl restart asset-campaign"
printf "${GREEN}═══════════════════════════════════════════════════${NC}\n"
