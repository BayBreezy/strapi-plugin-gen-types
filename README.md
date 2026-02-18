<img src="/Gen Types Logo.png" style="height: 70px; margin: 0px; border-radius: 12px;" />

# Strapi Plugin Gen Types

Generate types for the different collections, single types & components found in your application.

![Screenshot of Gen Types UI in Strapi Admin Panel](/screenshot.jpeg)

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
- `include` - Glob patterns to include content types/components. Matches `api::name.name` and `component::category.name`
- `exclude` - Glob patterns to exclude content types/components. Matches `api::name.name` and `component::category.name`
- `clearOutput` - Remove the output file/folder before generating types. Default: `false`
- `extendTypes` - Add custom properties to built-in types. Accepts an object with keys: `User`, `Role`, `Media`, `MediaFormat`, `FindOne`, `FindMany`. Values should be TypeScript property definitions as strings.

When a referenced type is excluded, the attribute will be typed as `any` and no import is generated.
Core Strapi types (`User`, `Role`) are always kept unless you explicitly exclude their UIDs.

```typescript
// config/plugins.ts
export default ({ env }) => ({
  "gen-types": {
    enabled: true,
    config: {
      outputLocation: "myTypes.ts",
      // If this is true, then the outputLocation should be the location to a .ts file
      singleFile: true,
      clearOutput: true,
      include: ["api::blog.*", "component::shared.*"],
      exclude: ["api::internal.*"],
      // Extend built-in types with custom properties
      extendTypes: {
        User: "firstName?: string;\nlastName?: string;\nage?: number;",
        Role: "permissions?: string[];",
        Media: "uploadedBy?: number;",
        FindOne: "requestId?: string;",
        FindMany: "requestId?: string;",
      },
    },
  },
});
```

The plugin will generate types for the collections found in the `api` folder of your Strapi project.

It will also add a few extra interfaces like `User`, `Role`, `Media` etc.

### Extending Built-in Types

You can add custom properties to the built-in types using the `extendTypes` config option. This is useful when you've added custom fields to your User model or want to add metadata to API responses.

```typescript
// config/plugins.ts
export default ({ env }) => ({
  "gen-types": {
    enabled: true,
    config: {
      extendTypes: {
        // Add custom fields to User interface
        User: `firstName?: string;
  lastName?: string;
  phoneNumber?: string;`,
        // Add custom fields to Role interface
        Role: `permissions?: string[];
  level?: number;`,
        // Add custom metadata to Media interface
        Media: `uploadedBy?: number;
  folder?: string;`,
        // Add custom fields to FindOne/FindMany meta
        FindOne: `requestId?: string;
  timestamp?: Date;`,
        FindMany: `requestId?: string;
  timestamp?: Date;`,
      },
    },
  },
});
```

This will extend the generated interfaces with your custom properties while keeping all the default Strapi fields.

## Admin UI

The plugin will add a new menu item `Generated Types`. This page will show the generated interfaces.

You can expand each interface to see the fields and their types.

Clicking on the copy button will copy the interface to your clipboard.

## License

MIT

## Contributing

I am super new to React. I prefer Nuxt. I am not sure if how I implemented the Admin UI is the best way to do it. I would appreciate any help in improving it. Thanks.

Just fork the repo and create a PR. I will be happy to merge it.
