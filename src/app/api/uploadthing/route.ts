import { createRouteHandler } from "uploadthing/next";
import { repligramFileRouter } from "./core";

export const handler = createRouteHandler({
  router: repligramFileRouter,
  config: { token: process.env.UPLOADTHING_TOKEN },
});

export { handler as GET, handler as POST };
