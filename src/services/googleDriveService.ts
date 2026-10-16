import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppStateData, exportBackupData, importBackupData } from '../utils/qcStorage';

// Khởi tạo Firebase App nếu chưa có
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Cấu hình Google Auth Provider với Scope Google Drive
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.appdata');

// Cache in-memory token theo khuyến nghị của Google Workspace Integration Skill
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const SYNC_FILENAME = 'IQC_DATABASE_SYNC.json';

export interface DriveFileInfo {
  exists: boolean;
  fileId?: string;
  name?: string;
  modifiedTime?: string;
  size?: number;
}

/**
 * Khởi tạo lắng nghe trạng thái đăng nhập Firebase Google Auth
 */
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Đăng nhập tài khoản Google để cấp quyền kết nối Google Drive
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không nhận được mã truy cập (Access Token) từ Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Lỗi đăng nhập Google Auth:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Lấy Access Token trong bộ nhớ
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Đăng xuất Google khỏi phiên làm việc
 */
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Tìm tệp cơ sở dữ liệu IQC_DATABASE_SYNC.json trên Google Drive
 */
export const findDriveDatabaseFile = async (token: string): Promise<DriveFileInfo> => {
  try {
    const q = encodeURIComponent(`name = '${SYNC_FILENAME}' and trashed = false`);
    const fields = encodeURIComponent('files(id, name, modifiedTime, size)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&spaces=drive`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Lỗi khi truy vấn Google Drive:', errText);
      return { exists: false };
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      const file = data.files[0];
      return {
        exists: true,
        fileId: file.id,
        name: file.name,
        modifiedTime: file.modifiedTime,
        size: Number(file.size || 0),
      };
    }

    return { exists: false };
  } catch (err) {
    console.error('Lỗi tìm tệp Drive:', err);
    return { exists: false };
  }
};

/**
 * Đồng bộ toàn bộ dữ liệu nội kiểm lên Google Drive
 * Dùng multipart upload nếu tạo mới, hoặc media upload nếu cập nhật
 */
export const uploadDatabaseToDrive = async (
  token: string, 
  state: AppStateData
): Promise<{ fileId: string; modifiedTime: string }> => {
  const jsonContent = exportBackupData(state);
  const existing = await findDriveDatabaseFile(token);

  if (existing.exists && existing.fileId) {
    // Cập nhật tệp hiện có bằng PATCH
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existing.fileId}?uploadType=media`;
    const res = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonContent,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Không thể cập nhật tệp lên Google Drive: ${err}`);
    }

    const updatedFile = await res.json();
    return {
      fileId: updatedFile.id,
      modifiedTime: updatedFile.modifiedTime || new Date().toISOString(),
    };
  } else {
    // Tạo tệp mới bằng multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: SYNC_FILENAME,
      mimeType: 'application/json',
      description: 'Cơ sở dữ liệu nội kiểm xét nghiệm y khoa IQC by ThinhXu (Đồng bộ đa máy trạm)',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Không thể tạo tệp mới trên Google Drive: ${err}`);
    }

    const newFile = await res.json();
    return {
      fileId: newFile.id,
      modifiedTime: newFile.modifiedTime || new Date().toISOString(),
    };
  }
};

/**
 * Tải cơ sở dữ liệu mới nhất từ Google Drive về máy tính hiện tại
 */
export const downloadDatabaseFromDrive = async (
  token: string
): Promise<{ data: AppStateData; modifiedTime: string; fileId: string }> => {
  const existing = await findDriveDatabaseFile(token);
  if (!existing.exists || !existing.fileId) {
    throw new Error('Chưa tìm thấy tệp IQC_DATABASE_SYNC.json trên tài khoản Google Drive của bạn. Vui lòng bấm "Đồng bộ lên Google Drive" từ máy trạm chính trước.');
  }

  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${existing.fileId}?alt=media`;
  const res = await fetch(downloadUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Không thể tải tệp từ Google Drive: ${err}`);
  }

  const jsonString = await res.text();
  const restoredState = importBackupData(jsonString);

  if (!restoredState) {
    throw new Error('Tệp tải từ Google Drive không đúng định dạng dữ liệu IQC hợp lệ.');
  }

  return {
    data: restoredState,
    modifiedTime: existing.modifiedTime || new Date().toISOString(),
    fileId: existing.fileId,
  };
};
