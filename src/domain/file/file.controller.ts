import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from '~/src/domain/file/file.service';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}
  @Post('video/upload')
  @UseInterceptors(FileInterceptor('video'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.uploadFile(file);
  }
}
