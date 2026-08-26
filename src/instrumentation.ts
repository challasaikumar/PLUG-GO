export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.PNG_SKIP_STARTUP_VALIDATION === "true") return;
  const { validateReleaseEnv } = await import("@/lib/release/startup");
  const result = validateReleaseEnv({ throwOnError: false });
  if (!result.ok) {
    const fatal = result.issues.filter((issue) => issue.level === "error");
    console.error("[release] startup validation failed", fatal.map((issue) => issue.code).join(","));
    if (result.env === "production" || result.env === "pilot" || result.env === "staging") {
      throw new Error(`Plug and Go startup validation failed: ${fatal.map((issue) => issue.message).join("; ")}`);
    }
  }
}
