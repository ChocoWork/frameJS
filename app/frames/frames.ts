import { createFrames } from "frames.js/next";
import { farcasterHubContext } from "frames.js/middleware";

type State = {
  counter: number;
};

export const frames = createFrames<State>({
  basePath: "/frames",
  initialState: { counter: 0 },
  debug: process.env.NODE_ENV === "development",
  middleware: [
    farcasterHubContext({
      hubHttpUrl: "https://nemes.farcaster.xyz:2281",
    }),
  ],
});
