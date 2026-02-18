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
    ],
  },
};
