# Strapi Plugin Gen Types

Generate types for the different collections, single types & components found in your application.

> This plugin is still in development. Please use with caution.

> This plugin will not run in production. It is only meant to be used in development.

## Installation

```bash
yarn add strapi-plugin-gen-types
```

```bash
npm install strapi-plugin-gen-types
```

## Configuration

You can configure the plugin by updating the `config/plugins.ts` file in your Strapi project.

The following options are available:

- `outputLocation` - The location where the types will be generated. Default: `src/genTypes`
- `singleFile` - Whether to generate a single file for all types or separate files for each collection. Default: `false`

```typescript
// config/plugins.ts
export default ({ env }) => ({
  "strapi-plugin-gen-types": {
    enabled: true,
    config: {
      outputLocation: "myTypes.ts",
      // If this is true, then the outputLocation should be the location to a .ts file
      singleFile: true,
    },
  },
});
```

The plugin will generate types for the collections found in the `api` folder of your Strapi project.

It will also add a few extra interfaces like `User`, `Role`, `Media` etc.

## Admin UI

The plugin will add a new menu item `Generated Types`. This page will show the generated interfaces.

You can expand each interface to see the fields and their types.

Clicking on the copy button will copy the interface to your clipboard.

## License

MIT

## Contributing

I am super new to React. I prefer Nuxt. I am not sure if how I implemented the Admin UI is the best way to do it. I would appreciate any help in improving it. Thanks.

Just fork the repo and create a PR. I will be happy to merge it.
