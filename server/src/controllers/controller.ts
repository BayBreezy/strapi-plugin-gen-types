import type { Core } from "@strapi/strapi";
import { pluginName } from "../genTypes/types";

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx) {
    const res = strapi.plugin(pluginName).service("service").generateInterfaceStrings();
    return res;
  },
});

export default controller;
