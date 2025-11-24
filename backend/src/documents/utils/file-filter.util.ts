import { Request } from 'express';

export function fileFilter(
  req: Request,
  file: any,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new Error('Invalid file type. Only PDF and PPTX files are allowed.'),
      false,
    );
  }
}
