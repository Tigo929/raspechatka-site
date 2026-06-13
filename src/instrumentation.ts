export async function register() {
  // Выполняем только в Node.js runtime (не в Edge).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateServerConfig } = await import("./lib/env-validation");
    validateServerConfig();
  }
}
