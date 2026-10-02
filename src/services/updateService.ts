export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  exeDownloadUrl: string | null;
  releaseUrl: string;
}

export const APP_CURRENT_VERSION = 'v1.0.0';
export const GITHUB_REPO = 'thinhxuqb/IQC.new';

export async function checkGitHubReleaseUpdate(): Promise<UpdateInfo> {
  const currentVersion = APP_CURRENT_VERSION;
  const fallbackUrl = `https://github.com/${GITHUB_REPO}/releases`;

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
        releaseNotes: 'Hệ thống đang chạy phiên bản ổn định mới nhất.',
        publishedAt: new Date().toISOString(),
        exeDownloadUrl: `${fallbackUrl}/latest`,
        releaseUrl: fallbackUrl,
      };
    }

    const data = await res.json();
    const latestVersion = data.tag_name || data.name || currentVersion;
    
    // Tìm file .exe trong danh sách assets
    let exeDownloadUrl: string | null = null;
    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const exeAsset = data.assets.find((asset: { name: string; browser_download_url: string }) => 
        asset.name.toLowerCase().endsWith('.exe')
      );
      if (exeAsset) {
        exeDownloadUrl = exeAsset.browser_download_url;
      }
    }

    // Nếu không tìm thấy asset .exe, dẫn link đến release page
    if (!exeDownloadUrl) {
      exeDownloadUrl = data.html_url || `${fallbackUrl}/tag/${latestVersion}`;
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
      exeDownloadUrl: fallbackUrl,
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
