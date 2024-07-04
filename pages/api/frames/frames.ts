import { createFrames } from "frames.js/next/pages-router/server";
import { farcasterHubContext } from "frames.js/middleware";

export const frames = createFrames({
  basePath: "/api/frames",
  middleware: [
    farcasterHubContext({
      hubHttpUrl: "https://nemes.farcaster.xyz:2281",
    }),
  ],
});
