import type { Core } from "@strapi/strapi";
import { destr } from "destr";
import fs from "fs";
import _ from "lodash";
import micromatch from "micromatch";
import path from "path";
import type { GenTypesConfig } from "../config";
import {
  buildFindManyPayload,
  buildFindOnePayload,
  buildMediaFields,
  buildMediaFormatFields,
  buildRoleFields,
  buildUserFields,
  metaFields,
} from "../genTypes/constants";
import { pluginName, StrapiAttribute, StrapiSchema } from "../genTypes/types";

const constructImportLine = (model: string, quote: "'" | '"') =>
  `import { ${model} } from ${quote}./${_.camelCase(model)}${quote};`;

const getApiUidFromSchemaFile = (schemaFile: string): string => {
  const modelName = path.basename(path.dirname(schemaFile));
  return `api::${modelName}.${modelName}`;
};

const getComponentUidFromSchemaFile = (schemaFile: string): string => {
  const category = path.basename(path.dirname(schemaFile));
  const name = path.parse(schemaFile).name;
  return `component::${category}.${name}`;
};

const normalizePatterns = (patterns?: string[] | string): string[] => {
  if (!patterns) {
    return [];
  }
  if (Array.isArray(patterns)) {
    return patterns.filter(Boolean);
  }
  return [patterns].filter(Boolean);
};

const coreUids = new Set(["plugin::users-permissions.user", "plugin::users-permissions.role"]);

const isCoreUid = (uid: string): boolean => coreUids.has(uid);

const matchesFilters = (uid: string, include?: string[] | string, exclude?: string[] | string): boolean => {
  const includeList = normalizePatterns(include);
  const excludeList = normalizePatterns(exclude);

  if (isCoreUid(uid)) {
    return !(excludeList.length > 0 && micromatch.isMatch(uid, excludeList));
  }

  if (includeList.length > 0 && !micromatch.isMatch(uid, includeList)) {
    return false;
  }

  if (excludeList.length > 0 && micromatch.isMatch(uid, excludeList)) {
    return false;
  }

  return true;
};

const shouldIncludeUid = (uid: string, include?: string[] | string, exclude?: string[] | string): boolean =>
  matchesFilters(uid, include, exclude);

// In-memory stats tracker
let generationStats = {
  lastGenerated: undefined as string | undefined,
  status: "never-run" as "success" | "error" | "never-run",
  errorMessage: undefined as string | undefined,
};

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Walk a directory and return an array of file paths
   * @param dir - The directory to walk
   * @returns An array of file paths
   */
  walkDirectory: (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.resolve(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(strapi.service(`plugin::${pluginName}.service`).walkDirectory(filePath));
      } else if (file.endsWith(".json")) {
        results.push(filePath);
      }
    });
    return results;
  },
  /**
   * Get the model name from the target string
   *
   * @param target The target string (e.g., 'api::patient.patient')
   * @returns The model name (e.g., 'Patient')
   */
  getModelNameFromTarget: (target: string): string => {
    const parts = target.split(".").pop();
    return _.upperFirst(_.camelCase(parts));
  },
  /**
   * Generate a TypeScript type for a Strapi attribute
   */
  generateTypeForAttribute: (
    attribute: StrapiAttribute,
    include?: string[] | string,
    exclude?: string[] | string
  ): string => {
    switch (attribute.type) {
      case "string":
      case "text":
      case "email":
      case "password":
      case "richtext":
      case "uid":
        return "string";
      case "number":
      case "integer":
      case "biginteger":
      case "float":
      case "decimal":
        return "number";
      case "boolean":
        return "boolean";
      case "date":
      case "datetime":
      case "time":
        return "Date | string";
      case "json":
        return "Record<string, any>";
      case "enumeration":
        return attribute.enum ? attribute.enum.map((val) => `"${val}"`).join(" | ") : "string";
      case "media":
        if (attribute.multiple) {
          return "Media[] | null";
        }
        return "Media | null";
      case "component":
        if (attribute.component) {
          const componentUid = `component::${attribute.component}`;
          if (!shouldIncludeUid(componentUid, include, exclude)) {
            return "any";
          }
        }
        const componentName = _.upperFirst(_.camelCase(attribute.component));
        if (attribute.repeatable) {
          return `${componentName}[] | null`;
        }
        return `${componentName} | null`;
      case "relation":
        // For relations, use the target to determine the type (model name)
        if (attribute.target) {
          if (!shouldIncludeUid(attribute.target, include, exclude)) {
            return "any";
          }
          const relatedModel = strapi
            .service(`plugin::${pluginName}.service`)
            .getModelNameFromTarget(attribute.target);
          if (attribute.relation === "oneToMany" || attribute.relation === "manyToMany") {
            return `${relatedModel}[] | null`; // Array for many-to-one/many-to-many
          }
          return `${relatedModel} | null`; // Single relation
        }
        return "any";
      default:
        return "any";
    }
  },
  // Generate TypeScript interface from Strapi schema
  generateInterfaceFromSchema: (
    modelName: string,
    schema: StrapiSchema,
    isComponent = false,
    include?: string[] | string,
    exclude?: string[] | string
  ): { interfaceString: string; imports: string[] } => {
    let interfaceString = `export interface ${_.upperFirst(_.camelCase(modelName))} {`;

    // Collect imports for relations
    let imports: string[] = [];
    if (isComponent) {
      interfaceString += `\n  id?: number;\n`;
    } else {
      // Add meta fields if schema is not a component
      interfaceString += metaFields;
    }
    // Add attributes
    Object.entries(schema.attributes).forEach(([key, attribute]) => {
      const tsType = strapi
        .service(`plugin::${pluginName}.service`)
        .generateTypeForAttribute(attribute, include, exclude);
      interfaceString += `  ${key}${attribute.required ? "" : "?"}: ${tsType};\n`;

      // Handle relations and add necessary imports
      if (attribute.type === "relation" && attribute.target) {
        if (!shouldIncludeUid(attribute.target, include, exclude)) {
          return;
        }
        const relatedModel = strapi
          .service(`plugin::${pluginName}.service`)
          .getModelNameFromTarget(attribute.target);
        if (!imports.includes(relatedModel)) {
          imports.push(relatedModel);
        }
      }
      // Handle media fields and add necessary imports
      // Ensure it is not already in the imports
      if (attribute.type === "media") {
        if (!imports.includes("Media")) {
          imports.push("Media");
        }
      }
      // for components, add the component import
      if (attribute.type === "component" && attribute.component) {
        const componentUid = `component::${attribute.component}`;
        if (!shouldIncludeUid(componentUid, include, exclude)) {
          return;
        }
        // replace the dots(.) with _ and then convert to camelCase
        const componentName = _.upperFirst(_.camelCase(attribute.component.replace(/\./g, "_")));
        if (!imports.includes(componentName)) {
          imports.push(componentName);
        }
      }
    });

    interfaceString += "};\n";

    return { interfaceString, imports };
  },
  generateInterfaceStrings: (
    include?: string[] | string,
    exclude?: string[] | string,
    extendTypes?: {
      User?: string;
      Role?: string;
      Media?: string;
      MediaFormat?: string;
      FindOne?: string;
      FindMany?: string;
    }
  ) => {
    const apiDir = `${process.cwd()}/src/api`;
    const componentsDir = `${process.cwd()}/src/components`;

    let schemaFiles = [];
    if (fs.existsSync(apiDir))
      schemaFiles = strapi.service(`plugin::${pluginName}.service`).walkDirectory(apiDir);
    let componentSchemaFiles = [];
    if (fs.existsSync(componentsDir))
      componentSchemaFiles = strapi.service(`plugin::${pluginName}.service`).walkDirectory(componentsDir);

    schemaFiles = schemaFiles.filter((schemaFile) =>
      matchesFilters(getApiUidFromSchemaFile(schemaFile), include, exclude)
    );
    componentSchemaFiles = componentSchemaFiles.filter((schemaFile) =>
      matchesFilters(getComponentUidFromSchemaFile(schemaFile), include, exclude)
    );

    const holdingArray = new Map();
    componentSchemaFiles.forEach((schemaFile) => {
      const schemaJson = fs.readFileSync(schemaFile, "utf-8");
      const schema: StrapiSchema = destr(schemaJson);
      const modelName = path.basename(path.dirname(schemaFile)); // Use parent folder name as model name

      // Generate the TypeScript interface
      const { interfaceString, imports } = strapi
        .service(`plugin::${pluginName}.service`)
        .generateInterfaceFromSchema(modelName, schema, true, include, exclude);

      const recordTitle = _.upperFirst(_.camelCase(modelName));

      // add to holding array
      holdingArray.set(recordTitle, interfaceString);
    });
    schemaFiles.forEach((schemaFile) => {
      const schemaJson = fs.readFileSync(schemaFile, "utf-8");
      const schema: StrapiSchema = destr(schemaJson);
      const modelName = path.basename(path.dirname(schemaFile)); // Use parent folder name as model name

      // Generate the TypeScript interface
      const { interfaceString, imports } = strapi
        .service(`plugin::${pluginName}.service`)
        .generateInterfaceFromSchema(modelName, schema, false, include, exclude);

      const recordTitle = _.upperFirst(_.camelCase(modelName));

      // add to holding array
      holdingArray.set(recordTitle, interfaceString);
    });
    // Add other interfaces to the holding array with custom fields
    const mediaFieldsWithCustom =
      buildMediaFields(extendTypes?.Media) + "\n" + buildMediaFormatFields(extendTypes?.MediaFormat);
    const userFieldsWithCustom = buildUserFields(extendTypes?.User);
    const roleFieldsWithCustom = buildRoleFields(extendTypes?.Role);
    const findOnePayloadWithCustom = buildFindOnePayload(extendTypes?.FindOne);
    const findManyPayloadWithCustom = buildFindManyPayload(extendTypes?.FindMany);

    holdingArray.set("Media", mediaFieldsWithCustom);
    holdingArray.set("User", userFieldsWithCustom);
    holdingArray.set("Role", roleFieldsWithCustom);
    holdingArray.set("FindOnePayload", findOnePayloadWithCustom);
    holdingArray.set("FindManyPayload", findManyPayloadWithCustom);

    // return the map as an array
    return Object.fromEntries(holdingArray);
  },
  /**
   * Generate TypeScript interfaces from Strapi schema files
   */
  generateInterfaces: (
    outPath: string,
    singleFile: boolean,
    singleQuote: boolean = true,
    clearOutput: boolean = false,
    include?: string[] | string,
    exclude?: string[] | string,
    extendTypes?: {
      User?: string;
      Role?: string;
      Media?: string;
      MediaFormat?: string;
      FindOne?: string;
      FindMany?: string;
    }
  ) => {
    try {
      const apiDir = `${process.cwd()}/src/api`;
      const componentsDir = `${process.cwd()}/src/components`;
      const quoteSymbol = singleQuote ? `'` : `"`;
      if (clearOutput) {
        if (fs.existsSync(outPath)) {
          const stat = fs.statSync(outPath);
          if (stat.isDirectory()) {
            fs.rmSync(outPath, { recursive: true, force: true });
          } else {
            fs.rmSync(outPath, { force: true });
          }
        }
      }

      let schemaFiles = [];
      if (fs.existsSync(apiDir))
        schemaFiles = strapi.service(`plugin::${pluginName}.service`).walkDirectory(apiDir);
      let componentSchemaFiles = [];
      if (fs.existsSync(componentsDir))
        componentSchemaFiles = strapi.service(`plugin::${pluginName}.service`).walkDirectory(componentsDir);

      schemaFiles = schemaFiles.filter((schemaFile) =>
        matchesFilters(getApiUidFromSchemaFile(schemaFile), include, exclude)
      );
      componentSchemaFiles = componentSchemaFiles.filter((schemaFile) =>
        matchesFilters(getComponentUidFromSchemaFile(schemaFile), include, exclude)
      );

      let consolidatedInterfaces = "";
      let consolidatedImports: Set<string> = new Set();
      let consolidatedDeclaredModels: Set<string> = new Set();

      componentSchemaFiles.forEach((schemaFile) => {
        const schemaJson = fs.readFileSync(schemaFile, "utf-8");
        const schema: StrapiSchema = destr(schemaJson);
        const modelName = `${path.basename(path.dirname(schemaFile))}.${path.parse(schemaFile).name}`; // Use parent folder + file name as model name

        // Generate the TypeScript interface
        const { interfaceString, imports } = strapi
          .service(`plugin::${pluginName}.service`)
          .generateInterfaceFromSchema(modelName, schema, true, include, exclude);
        const declaredModel = _.upperFirst(_.camelCase(modelName));

        if (singleFile) {
          // Consolidate interfaces and collect unique imports
          consolidatedInterfaces += `\n${interfaceString}`;
          imports.forEach((importedModel) => consolidatedImports.add(importedModel));
          consolidatedDeclaredModels.add(declaredModel);
        } else {
          // Ensure output directory exists
          if (!fs.existsSync(outPath)) {
            fs.mkdirSync(outPath);
          }
          // Save the interface to a TypeScript file
          const outputFilePath = path.resolve(outPath, `${_.camelCase(modelName)}.ts`);

          // Generate imports for the interface (avoid self-imports)
          const importStatements = imports
            .filter((model) => model !== declaredModel)
            .map((model) => constructImportLine(model, quoteSymbol))
            .join("\n");

          const fileContent = `${importStatements}\n\n${interfaceString}`;
          fs.writeFileSync(outputFilePath, fileContent);
          strapi.log.info(`Generated interface for ${modelName} at ${outputFilePath}`);
        }
      });

      schemaFiles.forEach((schemaFile) => {
        const schemaJson = fs.readFileSync(schemaFile, "utf-8");
        const schema: StrapiSchema = destr(schemaJson);
        const modelName = path.basename(path.dirname(schemaFile)); // Use parent folder name as model name

        // Generate the TypeScript interface
        const { interfaceString, imports } = strapi
          .service(`plugin::${pluginName}.service`)
          .generateInterfaceFromSchema(modelName, schema, false, include, exclude);
        const declaredModel = _.upperFirst(_.camelCase(modelName));

        if (singleFile) {
          // Consolidate interfaces and collect unique imports
          consolidatedInterfaces += `\n${interfaceString}`;
          imports.forEach((importedModel) => consolidatedImports.add(importedModel));
          consolidatedDeclaredModels.add(declaredModel);
        } else {
          // Ensure output directory exists
          if (!fs.existsSync(outPath)) {
            fs.mkdirSync(outPath);
          }
          // Save the interface to a TypeScript file
          const outputFilePath = path.resolve(outPath, `${_.camelCase(modelName)}.ts`);

          // Generate imports for the interface (avoid self-imports)
          const importStatements = imports
            .filter((model) => model !== declaredModel)
            .map((model) => constructImportLine(model, quoteSymbol))
            .join("\n");

          const fileContent = `${importStatements}\n\n${interfaceString}`;
          fs.writeFileSync(outputFilePath, fileContent);
          strapi.log.info(`Generated interface for ${modelName} at ${outputFilePath}`);
        }
      });

      if (singleFile) {
        // Add mediaFields, userFields, roleFields, findOnePayload, and findManyPayload to the consolidated
        // interfaces file with custom fields
        const mediaFieldsWithCustom =
          buildMediaFields(extendTypes?.Media) + "\n" + buildMediaFormatFields(extendTypes?.MediaFormat);
        const userFieldsWithCustom = buildUserFields(extendTypes?.User);
        const roleFieldsWithCustom = buildRoleFields(extendTypes?.Role);
        const findOnePayloadWithCustom = buildFindOnePayload(extendTypes?.FindOne);
        const findManyPayloadWithCustom = buildFindManyPayload(extendTypes?.FindMany);

        consolidatedInterfaces += `\n${mediaFieldsWithCustom}\n${userFieldsWithCustom}\n${roleFieldsWithCustom}\n${findOnePayloadWithCustom}\n${findManyPayloadWithCustom}`;

        const builtInDeclaredModels = new Set([
          "Media",
          "MediaFormat",
          "User",
          "Role",
          "FindOne",
          "FindMany",
        ]);

        // Generate import statements for unresolved references only.
        // Do not import models that are declared in the same consolidated file.
        const importStatements = Array.from(consolidatedImports)
          .filter((model) => !consolidatedDeclaredModels.has(model) && !builtInDeclaredModels.has(model))
          .map((model) => constructImportLine(model, quoteSymbol))
          .join("\n");

        const finalContent = importStatements
          ? `${importStatements}\n\n${consolidatedInterfaces}`
          : consolidatedInterfaces;
        fs.writeFileSync(outPath, finalContent);
        strapi.log.info(`Generated consolidated interfaces at ${outPath}`);
      }
      if (!singleFile) {
        // ensure outPath exists
        if (!fs.existsSync(outPath)) {
          fs.mkdirSync(outPath);
        }
        // Create the files for userFields, roleFields, findOnePayload, and findManyPayload with custom fields
        // Add role import to userFields
        const roleImport = constructImportLine("Role", quoteSymbol) + "\n";

        const userFieldsWithCustom = buildUserFields(extendTypes?.User);
        const roleFieldsWithCustom = buildRoleFields(extendTypes?.Role);
        const mediaFieldsWithCustom =
          buildMediaFields(extendTypes?.Media) + "\n" + buildMediaFormatFields(extendTypes?.MediaFormat);
        const findOnePayloadWithCustom = buildFindOnePayload(extendTypes?.FindOne);
        const findManyPayloadWithCustom = buildFindManyPayload(extendTypes?.FindMany);

        fs.writeFileSync(path.resolve(outPath, "user.ts"), roleImport + userFieldsWithCustom);
        fs.writeFileSync(path.resolve(outPath, "role.ts"), roleFieldsWithCustom);
        fs.writeFileSync(path.resolve(outPath, "media.ts"), mediaFieldsWithCustom);
        fs.writeFileSync(path.resolve(outPath, "findOnePayload.ts"), findOnePayloadWithCustom);
        fs.writeFileSync(path.resolve(outPath, "findManyPayload.ts"), findManyPayloadWithCustom);
      }

      // Update generation stats on success
      generationStats = {
        lastGenerated: new Date().toISOString(),
        status: "success",
        errorMessage: undefined,
      };
    } catch (error: any) {
      // Update generation stats on error
      generationStats = {
        lastGenerated: new Date().toISOString(),
        status: "error",
        errorMessage: error.message || "Unknown error during type generation",
      };
      strapi.log.error("Failed to generate types:", error);
      throw error;
    }
  },

  /**
   * Get generation statistics for the dashboard widget
   */
  getGenerationStats: () => {
    const config: GenTypesConfig = strapi.config.get("plugin::gen-types");
    const apiDir = `${process.cwd()}/src/api`;
    const componentsDir = `${process.cwd()}/src/components`;

    let apiCount = 0;
    let componentCount = 0;

    try {
      if (fs.existsSync(apiDir)) {
        const apiFiles = strapi.service(`plugin::${pluginName}.service`).walkDirectory(apiDir);
        apiCount = apiFiles.filter((file) =>
          matchesFilters(getApiUidFromSchemaFile(file), config?.include, config?.exclude)
        ).length;
      }

      if (fs.existsSync(componentsDir)) {
        const componentFiles = strapi.service(`plugin::${pluginName}.service`).walkDirectory(componentsDir);
        componentCount = componentFiles.filter((file) =>
          matchesFilters(getComponentUidFromSchemaFile(file), config?.include, config?.exclude)
        ).length;
      }
    } catch (error) {
      strapi.log.error("Error counting types:", error);
    }

    const hasFilters =
      (config?.include && config.include.length > 0) || (config?.exclude && config.exclude.length > 0);

    const hasExtendedTypes = config?.extendTypes && Object.keys(config.extendTypes).length > 0;

    return {
      lastGenerated: generationStats.lastGenerated,
      status: generationStats.status,
      errorMessage: generationStats.errorMessage,
      totalTypes: apiCount + componentCount,
      apiTypes: apiCount,
      componentTypes: componentCount,
      outputLocation: config?.outputLocation || "src/genTypes",
      singleFile: config?.singleFile || false,
      hasFilters,
      hasExtendedTypes,
      isProduction: process.env.NODE_ENV === "production",
    };
  },
});

export default service;
