#!/usr/bin/env bash
set -e

TOKEN="${1:-$GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "Vui lòng cung cấp GitHub Personal Access Token (PAT) có quyền 'repo':"
  read -r -s TOKEN
fi

if [ -z "$TOKEN" ]; then
  echo "Lỗi: Không tìm thấy GitHub Token."
  exit 1
fi

echo "Đang đẩy commit và tag v1.1.2 lên GitHub repository thinhxuqb/IQC.new..."
git push "https://${TOKEN}@github.com/thinhxuqb/IQC.new.git" main --tags

echo "=========================================================="
echo "✅ Đã đẩy mã nguồn và tag v1.1.2 lên GitHub thành công!"
echo "GitHub Actions đang tự động biên dịch bộ cài đặt Windows .exe tại:"
echo "https://github.com/thinhxuqb/IQC.new/actions"
echo "=========================================================="
