import * as React from "react";

import { type RepligramFileRouter } from "~/app/api/uploadthing/core";
import { uploadFiles } from "~/lib/uploadthing";
import { showErrorToast } from "~/lib/utils";
import { type StoredFile } from "~/types";

interface UseUploadProps {
  headers?: HeadersInit | (() => HeadersInit);
  onUploadBegin?: ({ file }: { file: string }) => void;
  onUploadProgress?: ({
    file,
    progress,
  }: {
    file: File;
    progress: number;
  }) => void;
  defaultUploadedFiles?: StoredFile[];
}

export function useUpload(
  endpoint: keyof RepligramFileRouter,
  { defaultUploadedFiles = [], ...props }: UseUploadProps = {},
) {
  const [uploadedFiles, setUploadedFiles] =
    React.useState<StoredFile[]>(defaultUploadedFiles);
  const [progresses, setProgresses] = React.useState<Record<string, number>>(
    {},
  );
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadThings(files: File[]) {
    setIsUploading(true);
    try {
      const res = await uploadFiles(endpoint, {
        ...props,
        files,
        onUploadProgress: ({ file, progress }) => {
          setProgresses((prev) => {
            return {
              ...prev,
              [file.name]: progress,
            };
          });
        },
      });

      const formattedRes = res.map((file) => {
        return {
          id: file.key,
          name: file.name,
          url: file.url,
        };
      }) satisfies StoredFile[];

      setUploadedFiles((prev) =>
        prev ? [...prev, ...formattedRes] : formattedRes,
      );

      return formattedRes;
    } catch (err) {
      showErrorToast(err);
    } finally {
      setProgresses({});
      setIsUploading(false);
    }
  }

  return {
    uploadedFiles,
    progresses,
    uploadFiles: uploadThings,
    isUploading,
  };
}
