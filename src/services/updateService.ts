export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  exeDownloadUrl: string | null;
  portableDownloadUrl: string | null;
  releaseUrl: string;
}

export const APP_CURRENT_VERSION = 'v1.0.0';
export const GITHUB_REPO = 'thinhxuqb/IQC.new';
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
export const GITHUB_LATEST_RELEASE_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
export const SETUP_EXE_FALLBACK_URL = `https://github.com/${GITHUB_REPO}/releases/download/${APP_CURRENT_VERSION}/IQC-by-ThinhXu-Setup-${APP_CURRENT_VERSION}.exe`;
export const PORTABLE_EXE_FALLBACK_URL = `https://github.com/${GITHUB_REPO}/releases/download/${APP_CURRENT_VERSION}/IQC-by-ThinhXu-Portable-${APP_CURRENT_VERSION}.exe`;

export async function checkGitHubReleaseUpdate(): Promise<UpdateInfo> {
  const currentVersion = APP_CURRENT_VERSION;
  const fallbackUrl = GITHUB_RELEASES_URL;

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      // Nếu chưa có release nào trên GitHub, trả về thông tin mặc định
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseName: 'IQC by ThinhXu Standard Edition',
        releaseNotes: 'Hệ thống đang chạy phiên bản ổn định mới nhất. Bản cài đặt Windows .exe và Portable có thể tải từ GitHub Releases.',
        publishedAt: new Date().toISOString(),
        exeDownloadUrl: SETUP_EXE_FALLBACK_URL,
        portableDownloadUrl: PORTABLE_EXE_FALLBACK_URL,
        releaseUrl: fallbackUrl,
      };
    }

    const data = await res.json();
    const latestVersion = data.tag_name || data.name || currentVersion;
    
    // Tìm file .exe trong danh sách assets (cả bản Setup và bản Portable)
    let exeDownloadUrl: string | null = null;
    let portableDownloadUrl: string | null = null;

    if (Array.isArray(data.assets) && data.assets.length > 0) {
      for (const asset of data.assets) {
        const name = (asset.name || '').toLowerCase();
        if (name.includes('setup') && name.endsWith('.exe')) {
          exeDownloadUrl = asset.browser_download_url;
        } else if (name.includes('portable') && name.endsWith('.exe')) {
          portableDownloadUrl = asset.browser_download_url;
        } else if (!exeDownloadUrl && name.endsWith('.exe')) {
          exeDownloadUrl = asset.browser_download_url;
        }
      }
    }

    // Nếu không tìm thấy trong assets, dùng URL cấu trúc chuẩn của GitHub Releases
    if (!exeDownloadUrl) {
      exeDownloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${latestVersion}/IQC-by-ThinhXu-Setup-${latestVersion}.exe`;
    }
    if (!portableDownloadUrl) {
      portableDownloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${latestVersion}/IQC-by-ThinhXu-Portable-${latestVersion}.exe`;
    }

    // So sánh phiên bản
    const hasUpdate = isNewerVersion(latestVersion, currentVersion);

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseName: data.name || latestVersion,
      releaseNotes: data.body || 'Cải tiến hiệu năng, cập nhật quy tắc Westgard và sửa các lỗi phát hiện.',
      publishedAt: data.published_at || new Date().toISOString(),
      exeDownloadUrl,
      portableDownloadUrl,
      releaseUrl: data.html_url || fallbackUrl,
    };
  } catch (error) {
    console.warn('Lỗi khi kiểm tra cập nhật từ GitHub:', error);
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      releaseName: 'IQC by ThinhXu',
      releaseNotes: 'Không thể kết nối đến máy chủ GitHub để kiểm tra bản mới.',
      publishedAt: new Date().toISOString(),
      exeDownloadUrl: SETUP_EXE_FALLBACK_URL,
      portableDownloadUrl: PORTABLE_EXE_FALLBACK_URL,
      releaseUrl: fallbackUrl,
    };
  }
}

// So sánh 2 chuỗi version: ví dụ v1.0.1 > v1.0.0
function isNewerVersion(latest: string, current: string): boolean {
  const clean = (v: string) => v.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const l = clean(latest);
  const c = clean(current);

  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lNum = l[i] || 0;
    const cNum = c[i] || 0;
    if (lNum > cNum) return true;
    if (lNum < cNum) return false;
  }
  return false;
}
