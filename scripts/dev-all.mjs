import { spawn } from "node:child_process";

function run(name, command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
  });
  child.on("exit", (code) => {
    if (code !== 0) {
      process.exitCode = code ?? 1;
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

run("client", "npm", ["run", "dev:client"]);
run("server", "npm", ["run", "dev:server"]);
