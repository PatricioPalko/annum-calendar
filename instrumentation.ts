export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logEnvProblems } = await import("./lib/env");

    logEnvProblems();
  }
}
