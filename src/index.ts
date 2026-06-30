import { readConfig, setUser } from "./config";

function main() {
  setUser("Laeth");

  const cfg = readConfig();

  console.log(cfg);
}

main();
