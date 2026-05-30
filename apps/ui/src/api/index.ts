import axios, {AxiosProgressEvent} from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {'Content-Type': 'application/json'},
});

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (password: string): Promise<string> => {
  const {data} = await api.post<{token: string}>('/auth', {password});
  sessionStorage.setItem('token', data.token);
  return data.token;
};

export const sendMessage = async (
  message: string,
  categories: string[],
  imageKey?: string,
): Promise<void> => {
  await api.post('/send', {message, categories, imageKey});
};

export const getUploadUrl = async (
  contentType: string,
): Promise<{uploadUrl: string; imageKey: string}> => {
  const {data} = await api.post<{uploadUrl: string; imageKey: string}>(
    '/upload-url',
    {contentType},
  );
  return data;
};

export const uploadImage = async (
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: {'Content-Type': file.type},
    onUploadProgress: (e: AxiosProgressEvent) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
};
