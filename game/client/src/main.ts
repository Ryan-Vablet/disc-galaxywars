import "@/ui/styles/global.css";
import { App } from "@/App";

async function main() {
  // Wait for fonts to load before starting the game
  await document.fonts.ready;

  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) {
    throw new Error("Missing #app root");
  }

  const app = new App(root);
  app.mount();
}

main();
