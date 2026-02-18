import { PLUGIN_ID } from "./pluginId";
import { Initializer } from "./components/Initializer";
import { PluginIcon } from "./components/PluginIcon";
import { prefixPluginTranslations } from "./utils/prefixPluginTranslations";
import { PERMISSIONS } from "./permissions";

export default {
  register(app: any) {
    // Register dashboard widget
    if ("widgets" in app) {
      app.widgets.register({
        icon: PluginIcon,
        title: {
          id: `${PLUGIN_ID}.widget.title`,
          defaultMessage: "Generated Types",
        },
        name: "gen-types-widget",
        component: async () => import("./components/GenTypesWidget").then((mod) => mod.GenTypesWidget),
        id: "gen-types-widget",
        pluginId: PLUGIN_ID,
        permissions: PERMISSIONS["menu-link"],
      });
    }

    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.page.title`,
        defaultMessage: PLUGIN_ID,
      },
      Component: () =>
        import("./pages/App").then((mod) => ({
          default: mod.App,
        })),
      permissions: PERMISSIONS["menu-link"],
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, PLUGIN_ID),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
