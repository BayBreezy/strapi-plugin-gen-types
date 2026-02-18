import type { Core } from "@strapi/strapi";
import type { GenTypesConfig } from "./config";
import { pluginName } from "./genTypes/types";

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  if (process.env.NODE_ENV === "production") {
    strapi.log.info("Gen Types Plugin is disabled in production");
  } else {
    const config: GenTypesConfig = strapi.config.get("plugin::gen-types");
    strapi
      .service(`plugin::${pluginName}.service`)
      .generateInterfaces(
        config.outputLocation,
        config.singleFile,
        config?.prettier?.singleQuote,
        config?.clearOutput,
        config?.include,
        config?.exclude
      );
    strapi.log.info("Gen Types Plugin registered");
  }
};

export default register;
