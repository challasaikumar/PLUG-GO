import "./load-env";
import { scanRepository } from "../src/lib/release/secret-scan";

const findings = scanRepository(process.cwd());
if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} ${finding.id}`);
  }
  process.exitCode = 1;
} else {
  console.log("OK no committed secret patterns found");
}
