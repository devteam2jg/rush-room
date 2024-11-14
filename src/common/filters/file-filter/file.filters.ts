import { BadRequestException } from '@nestjs/common';

export const imageVideoFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!(isImage(file) || isVideo(file))) {
    return callback(
      new BadRequestException('Only image and video files are allowed!'),
      false,
    );
  }
  callback(null, true);
};

const isImage = (file: Express.Multer.File) =>
  RegExp(/\/(jpeg|png|gif)$/).exec(file.mimetype);

const isVideo = (file: Express.Multer.File) =>
  RegExp(/\/(mp4|avi|mov|MOV|wmv)$/).exec(file.mimetype);
