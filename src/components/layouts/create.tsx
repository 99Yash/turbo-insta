"use client";

import { PlusIcon, UploadIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { useUpload } from "~/hooks/use-upload";
import { FileUploader } from "../file-uploader";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";

export function Create() {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>();

  const { uploadFiles, progresses, isUploading, uploadedFiles } =
    useUpload("postImage");

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <PlusIcon className="mr-2 size-4" aria-hidden="true" />
        Create
      </Button>
      <Modal showModal={open} setShowModal={setOpen}>
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md space-y-8 bg-background p-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create a new post
            </h1>
          </div>
          <FileUploader
            accept={{
              "image/*": [],
            }}
            maxFiles={3}
            progresses={progresses}
            disabled={isUploading}
            maxSize={1024 * 1024 * 10}
            onValueChange={(files) => {
              setFiles(files as File[]);
            }}
          />
          {files && (
            <Button
              className="mt-4 w-full bg-muted-foreground"
              onClick={async () => {
                await uploadFiles(files);
                setOpen(false);
              }}
            >
              <UploadIcon className="mr-2 size-4" aria-hidden="true" />
              Upload
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}
