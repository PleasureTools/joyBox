import axios from 'axios';
import { Observable } from 'rxjs';

import { UPLOAD_VIDEO_PATH } from '@Shared/Constants';

export default class FileUploader {
  public Upload(title: string, source: string, file: File, token: string): Observable<ProgressEvent> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('source', source);
    formData.append('file', file);

    const headers: { [name: string]: string; } = { 'Content-Type': 'multipart/form-data' };
    if (token.length) {
      headers.Authorization = token;
    }

    return new Observable<ProgressEvent>(o => {
      axios.post(UPLOAD_VIDEO_PATH, formData, {
        headers,
        onUploadProgress: (p: ProgressEvent) => o.next(p)
      })
        .then(() => o.complete())
        .catch(err => o.error((err.response && err.response.status) || 401));
    });
  }
}
