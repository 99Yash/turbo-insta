import { generateReactHelpers } from "@uploadthing/react";
import { UTApi } from "uploadthing/server";
import { type RepligramFileRouter } from "~/app/api/uploadthing/core";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<RepligramFileRouter>();

export const utapi = new UTApi();
