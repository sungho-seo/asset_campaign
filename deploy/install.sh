#!/usr/bin/env bash
# Ubuntu 22.04 사내 배포 스크립트
# 사용: sudo bash deploy/install.sh
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-/opt/asset_campaign}"
SERVICE_USER="${SERVICE_USER:-asset-campaign}"
REPO_URL="${REPO_URL:-https://github.com/sungho-seo/asset_campaign.git}"
BRANCH="${BRANCH:-claude/gifted-ritchie-Kn0PX}"
PORT="${PORT:-8049}"

if [[ $EUID -ne 0 ]]; then
  echo "이 스크립트는 sudo로 실행해야 합니다." >&2
  exit 1
fi

echo "[1/6] Node 20 LTS 확인/설치"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* && "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node --version
npm --version

echo "[2/6] 서비스 계정 생성"
if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  useradd -r -s /sbin/nologin -d "$INSTALL_DIR" "$SERVICE_USER"
fi

echo "[3/6] 코드 배치 ($INSTALL_DIR)"
if [[ -d "$INSTALL_DIR/.git" ]]; then
  cd "$INSTALL_DIR"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
fi
chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"

echo "[4/6] 의존성 설치 + 빌드"
sudo -u "$SERVICE_USER" -H bash -c "cd $INSTALL_DIR && npm ci && npm run build"

echo "[5/6] systemd 유닛 등록"
SERVICE_SRC="$INSTALL_DIR/deploy/asset-campaign.service"
SERVICE_DST="/etc/systemd/system/asset-campaign.service"
cp "$SERVICE_SRC" "$SERVICE_DST"
# WorkingDirectory와 PORT 치환
sed -i "s|/opt/asset_campaign|$INSTALL_DIR|g" "$SERVICE_DST"
sed -i "s|Environment=PORT=8049|Environment=PORT=$PORT|" "$SERVICE_DST"

systemctl daemon-reload
systemctl enable asset-campaign
systemctl restart asset-campaign

echo "[6/6] 상태 확인"
sleep 2
systemctl --no-pager status asset-campaign | head -20

echo ""
echo "=========================================="
echo "배포 완료. 접속: http://$(hostname -I | awk '{print $1}'):$PORT"
echo "로그: sudo journalctl -u asset-campaign -f"
echo "재시작: sudo systemctl restart asset-campaign"
echo "=========================================="
