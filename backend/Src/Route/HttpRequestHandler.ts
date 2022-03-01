import * as Path from 'path';
import * as Express from 'express';
import { Application, NextFunction, Request, Response } from 'express';
import * as History from 'connect-history-api-fallback';
import * as Multer from 'multer';

import { AppFacade } from '../AppFacade';
import { MediaInfo, ThumbnailGenerator } from '../Common/FFmpeg';
import { Logger } from '../Common/Logger';
import { FileSize, GenFilename, Timestamp, Unlink } from '../Common/Util';
import { ARCHIVE_FOLDER, THUMBNAIL_FOLDER } from '../Constants';
import { ArchiveRecord, AppAccessType } from '@Shared/Types';
import { UPLOAD_VIDEO_PATH } from '@Shared/Constants';
import { Config as C } from '../BootstrapConfiguration';
import { AccessGuard } from '../AccessGuard';

export class HttpRequestHandler {
  private readonly ARCHIVE_MOUNT_POINT = '/archive';

  public constructor(private app: AppFacade, private express: Application) {
    const uploadMiddleware = Multer({
      storage: Multer.diskStorage({
        destination: (req, file, cb) => cb(null, ARCHIVE_FOLDER),
        filename: (req, file, cb) => {
          const filename = GenFilename('local://' + Path.parse(file.originalname).name + '/local');
          req.on('aborted', () => Unlink(Path.join(ARCHIVE_FOLDER, filename)));
          cb(null, filename);
        }
      })
    }).single('file');

    if (C.DefaultAccess === AppAccessType.NO_ACCESS) {
      const authGuard = new AccessGuard(C.JwtSecret);
      this.express.use(`${this.ARCHIVE_MOUNT_POINT}/*.mp4`, authGuard.Middleware);
      this.express.post(UPLOAD_VIDEO_PATH, authGuard.Middleware, uploadMiddleware, this.UploadVideoRoute.bind(this));
    } else {
      this.express.post(UPLOAD_VIDEO_PATH, uploadMiddleware, this.UploadVideoRoute.bind(this));
    }

    this.express.use(this.ARCHIVE_MOUNT_POINT, Express.static('data/archive', { maxAge: 600000 }));

    const staticFrontend = Express.static('client/');
    // For really existing resources, just return them
    this.express.use(staticFrontend);
    // Anything else process via SPA
    this.express.use(History({
      index: '/index.html',
      disableDotRule: true
    }));
    this.express.use(staticFrontend);
  }

  public async UploadVideoRoute(request: Request, response: Response, next: NextFunction): Promise<void> {
    const thumbnailGen = new ThumbnailGenerator();
    const minfo = new MediaInfo();

    const filename = Path.join(ARCHIVE_FOLDER, request.file.filename);

    try {
      const info = await minfo.Info(filename);

      if (info === undefined) {
        response.status(500).end();
        return;
      }

      const duration = parseFloat(info.duration);
      await thumbnailGen.Generate(filename, duration / 10,
        Path.join(THUMBNAIL_FOLDER, Path.parse(request.file.filename).name));

      const record: ArchiveRecord = {
        title: request.body.title,
        source: request.body.source,
        timestamp: Timestamp(),
        duration,
        size: await FileSize(filename),
        reencoded: false,
        filename: request.file.filename,
        locked: false,
        tags: new Set<string>()
      };

      this.app.AddArchiveRecord(record);

      Logger.Get.Log(`New uploaded video ${record.filename}`);

      response.status(200).end();
    } catch (e) {
      response.status(500).end();
      Unlink(filename);
    }
  }
}
