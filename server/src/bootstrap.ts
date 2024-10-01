import type { Core } from "@strapi/strapi";

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  // Register permission actions.
  const actions = [
    {
      section: "plugins",
      displayName: "Allow access to the Gen Types interface",
      uid: "menu-link",
      pluginName: "gen-types",
    },
  ];
  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};

export default bootstrap;
