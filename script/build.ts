import { barelyServe } from "barely-a-dev-server";
import { config } from "./dev";

await barelyServe({
  ...config,
  dev: false,
  outDir: "./dist/web/speedlife.games/",
});
