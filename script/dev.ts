import { barelyServe } from "barely-a-dev-server";

export const config = {
  entryRoot: "./src/",
  esbuildOptions: {
    banner: {
      js: `globalThis.global = globalThis;`, // Workaround for some silly `pouchdb` dep.
    },
  },
};

if (import.meta.main) {
  await barelyServe(config);
}
