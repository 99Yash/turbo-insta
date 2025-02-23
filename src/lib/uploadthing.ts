import { generateReactHelpers } from "@uploadthing/react";
import { type RepligramFileRouter } from "~/app/api/uploadthing/core";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<RepligramFileRouter>();
