import "./load-env";
import { collectStartupIssues } from "../src/lib/release/startup";

const result = collectStartupIssues();
for (const issue of result.issues) {
  console.log(`${issue.level.toUpperCase()} ${issue.code}: ${issue.message}`);
}
if (!result.ok) {
  process.exitCode = 1;
} else {
  console.log(`OK png_env=${result.env}`);
}
