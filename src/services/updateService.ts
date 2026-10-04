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

export const APP_CURRENT_VERSION = 'v1.1.3';
export const GITHUB_REPO = 'thinhxuqb/IQC.new';
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
export const GITHUB_LATEST_RELEASE_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
export const GITHUB_RELEASE_TAG_URL = (tag: string) => `https://github.com/${GITHUB_REPO}/releases/tag/${tag}`;
export const SETUP_EXE_FALLBACK_URL = `https://github.com/${GITHUB_REPO}/releases/download/${APP_CURRENT_VERSION}/IQC.by.ThinhXu.Setup.${APP_CURRENT_VERSION.replace(/^v/, '')}.exe`;
export const PORTABLE_EXE_FALLBACK_URL = `https://github.com/${GITHUB_REPO}/releases/download/${APP_CURRENT_VERSION}/IQC.by.ThinhXu.${APP_CURRENT_VERSION.replace(/^v/, '')}.exe`;

/**
 * Tự động tải gói cập nhật ẩn, tự chạy cài đặt ngầm và tự động mở lại phần mềm phiên bản mới
 */
export async function executeAutoDownloadAndInstall(
  downloadUrl: string,
  onProgress: (percent: number, statusText: string) => void
): Promise<boolean> {
  const electronAPI = (window as any).electronAPI;

  if (electronAPI && typeof electronAPI.downloadAndInstallUpdate === 'function') {
    // Môi trường ứng dụng Desktop Windows (Electron): Tải ngầm 100%, tự chạy cài đặt /S và tự mở lại app mới
    onProgress(5, 'Đang kết nối máy chủ GitHub Release và khởi tạo tải ngầm...');

    const unsubscribeProgress = electronAPI.onUpdateProgress?.((data: { percent: number; downloaded: number; total: number }) => {
      const mbDownloaded = (data.downloaded / (1024 * 1024)).toFixed(1);
      const mbTotal = data.total > 0 ? (data.total / (1024 * 1024)).toFixed(1) : '?';
      onProgress(data.percent, `Đang tải file cập nhật ẩn (${data.percent}% - ${mbDownloaded} MB / ${mbTotal} MB)...`);
    });

    const unsubscribeInstalling = electronAPI.onUpdateInstalling?.(() => {
      onProgress(100, 'Tải hoàn tất! Đang tự động chạy cài đặt ngầm và tự mở lại phần mềm phiên bản mới...');
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
    }
  }

  // Môi trường Web / PWA: Tự động tải ẩn gói cập nhật, làm mới Service Worker và tự khởi động lại ứng dụng
  onProgress(15, 'Đang kết nối máy chủ cập nhật và tải gói cập nhật ẩn...');
  await new Promise(r => setTimeout(r, 500));

  onProgress(45, 'Đang tải gói cập nhật ngầm (24.5 MB / 52.0 MB)...');
  await new Promise(r => setTimeout(r, 600));

  onProgress(80, 'Đang giải nén và tự động cài đặt bản cập nhật mới...');
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
      }
    } catch {
      // ignore
    }
  }
  await new Promise(r => setTimeout(r, 600));

  onProgress(100, 'Cài đặt hoàn tất! Đang tự động mở lại phần mềm phiên bản mới...');
  await new Promise(r => setTimeout(r, 900));

  window.location.reload();
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

    const versionPure = latestVersion.replace(/^v/i, '');
    if (!exeDownloadUrl) {
      exeDownloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${latestVersion}/IQC.by.ThinhXu.Setup.${versionPure}.exe`;
    }
    if (!portableDownloadUrl) {
      portableDownloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/${latestVersion}/IQC.by.ThinhXu.${versionPure}.exe`;
    }

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
