import type { Core } from "@strapi/strapi";
import type { GenTypesConfig } from "./config";
import { pluginName } from "./genTypes/types";

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  if (process.env.NODE_ENV !== "development") {
    strapi.log.info("Gen Types Plugin is only active in development mode. Skipping type generation.");
  } else {
    const config: GenTypesConfig = strapi.config.get("plugin::gen-types");
    try {
      strapi
        .service(`plugin::${pluginName}.service`)
        .generateInterfaces(
          config.outputLocation,
          config.singleFile,
          config?.prettier?.singleQuote,
          config?.clearOutput,
          config?.include,
          config?.exclude,
          config?.extendTypes
        );
      strapi.log.info("Gen Types Plugin registered");
    } catch (error: any) {
      strapi.log.error("Gen Types Plugin failed to generate types:", error);
    }
  }
};

export default register;
