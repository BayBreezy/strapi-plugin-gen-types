import type { Core } from "@strapi/strapi";
import { pluginName } from "../genTypes/types";
import type { GenTypesConfig } from "../config";

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx) {
    const config: GenTypesConfig = strapi.config.get("plugin::gen-types");
    const res = strapi
      .plugin(pluginName)
      .service("service")
      .generateInterfaceStrings(config?.include, config?.exclude);
    return res;
  },
});

export default controller;
