import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getCachedUser } from "~/lib/queries/user";

const f = createUploadthing();

export const repligramFileRouter = {
  postImage: f({ image: { maxFileSize: "16MB", maxFileCount: 3 } })
    .middleware(async ({ req: _req }) => {
      const user = await getCachedUser();
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.ufsUrl);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return {
        userId: metadata.userId,
        file: {
          url: file.ufsUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        },
      };
    }),

  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req: _req }) => {
      const user = await getCachedUser();
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile image uploaded for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);
      return {
        userId: metadata.userId,
        file: {
          url: file.ufsUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        },
      };
    }),
} satisfies FileRouter;

export type RepligramFileRouter = typeof repligramFileRouter;
