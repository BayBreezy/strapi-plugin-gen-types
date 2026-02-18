import type { Core } from "@strapi/strapi";
import { pluginName } from "../genTypes/types";
import type { GenTypesConfig } from "../config";

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx) {
    const config: GenTypesConfig = strapi.config.get("plugin::gen-types");
    const res = strapi
      .plugin(pluginName)
      .service("service")
      .generateInterfaceStrings(config?.include, config?.exclude, config?.extendTypes);
    return res;
  },

  getStats(ctx) {
    const stats = strapi.plugin(pluginName).service("service").getGenerationStats();
    return stats;
  },

  async regenerate(ctx) {
    if (process.env.NODE_ENV === "production") {
      return ctx.badRequest("Type generation is disabled in production");
    }

    try {
      const config: GenTypesConfig = strapi.config.get("plugin::gen-types");
      await strapi
        .plugin(pluginName)
        .service("service")
        .generateInterfaces(
          config.outputLocation,
          config.singleFile,
          config?.prettier?.singleQuote,
          config?.clearOutput,
          config?.include,
          config?.exclude,
          config?.extendTypes
        );
      return { success: true };
    } catch (error: any) {
      strapi.log.error("Failed to regenerate types:", error);
      return ctx.badRequest(error.message || "Failed to regenerate types");
    }
  },
});

export default controller;
