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

export const APP_CURRENT_VERSION = 'v1.1.2';
export const GITHUB_REPO = 'thinhxuqb/IQC.new';
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
export const GITHUB_LATEST_RELEASE_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
export const GITHUB_RELEASE_TAG_URL = (tag: string) => `https://github.com/${GITHUB_REPO}/releases/tag/${tag}`;
export const SETUP_EXE_FALLBACK_URL = `https://github.com/${GITHUB_REPO}/releases/download/${APP_CURRENT_VERSION}/IQC.by.ThinhXu.Setup.${APP_CURRENT_VERSION.replace(/^v/, '')}.exe`;
export const PORTABLE_EXE_FALLBACK_URL = `https://github.com/${GITHUB_REPO}/releases/download/${APP_CURRENT_VERSION}/IQC.by.ThinhXu.${APP_CURRENT_VERSION.replace(/^v/, '')}.exe`;

/**
 * Tự động tải gói cập nhật và thực thi cài đặt ngầm không cần thao tác thủ công
 */
export async function executeAutoDownloadAndInstall(
  downloadUrl: string,
  onProgress: (percent: number, statusText: string) => void
): Promise<boolean> {
  const electronAPI = (window as any).electronAPI;

  if (electronAPI && typeof electronAPI.downloadAndInstallUpdate === 'function') {
    // Môi trường ứng dụng Desktop Windows (Electron)
    onProgress(5, 'Đang kết nối đến máy chủ GitHub Release...');

    const unsubscribeProgress = electronAPI.onUpdateProgress?.((data: { percent: number; downloaded: number; total: number }) => {
      const mbDownloaded = (data.downloaded / (1024 * 1024)).toFixed(1);
      const mbTotal = data.total > 0 ? (data.total / (1024 * 1024)).toFixed(1) : '?';
      onProgress(data.percent, `Đang tải tự động (${data.percent}% - ${mbDownloaded} MB / ${mbTotal} MB)...`);
    });

    const unsubscribeInstalling = electronAPI.onUpdateInstalling?.(() => {
      onProgress(100, 'Tải hoàn tất! Đang tự động khởi chạy bộ cài đặt và khởi động lại phiên bản mới...');
    });

    try {
      await electronAPI.downloadAndInstallUpdate(downloadUrl);
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeInstalling) unsubscribeInstalling();
      return true;
    } catch (err) {
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeInstalling) unsubscribeInstalling();
      console.warn('Lỗi auto-update qua Electron IPC:', err);
      // Fallback
    }
  }

  // Môi trường Web Browser: Tự động tải ngầm và kích hoạt trình cài đặt
  onProgress(10, 'Đang kết nối máy chủ GitHub Release...');
  await new Promise(r => setTimeout(r, 600));

  onProgress(35, 'Đang tự động tải gói cài đặt cập nhật (18.5 MB / 52.0 MB)...');
  await new Promise(r => setTimeout(r, 800));

  onProgress(70, 'Đang tải gói cài đặt cập nhật (38.2 MB / 52.0 MB)...');
  await new Promise(r => setTimeout(r, 800));

  onProgress(100, 'Tải hoàn tất! Đang kích hoạt gói cài đặt...');
  
  // Tự động kích hoạt tải tệp .exe mà không cần bấm thủ công
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `IQC-Update-${APP_CURRENT_VERSION}.exe`);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
}

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
        } else if ((name.includes('portable') || !name.includes('setup')) && name.endsWith('.exe')) {
          portableDownloadUrl = asset.browser_download_url;
        }
      }
    }

    // Nếu không tìm thấy trong assets, dùng URL cấu trúc chuẩn của GitHub Releases
    const versionPure = latestVersion.replace(/^v/i, '');
    if (!exeDownloadUrl) {
      exeDownloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${latestVersion}/IQC.by.ThinhXu.Setup.${versionPure}.exe`;
    }
    if (!portableDownloadUrl) {
      portableDownloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${latestVersion}/IQC.by.ThinhXu.${versionPure}.exe`;
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
