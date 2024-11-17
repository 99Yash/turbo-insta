import { createRouteHandler } from "uploadthing/next";
import { repligramFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: repligramFileRouter,
});
