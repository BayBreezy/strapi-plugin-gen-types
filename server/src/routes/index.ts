export default {
  admin: {
    type: "admin",
    routes: [
      {
        method: "GET",
        path: "/",
        handler: "controller.index",
        config: { auth: false, policies: [] },
      },
      {
        method: "GET",
        path: "/stats",
        handler: "controller.getStats",
        config: { auth: false, policies: [] },
      },
      {
        method: "POST",
        path: "/regenerate",
        handler: "controller.regenerate",
        config: { auth: false, policies: [] },
      },
    ],
  },
};
