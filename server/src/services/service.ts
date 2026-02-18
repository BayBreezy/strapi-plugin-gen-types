import type { Core } from "@strapi/strapi";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { pluginName } from "../genTypes/types";
import { StrapiAttribute, StrapiSchema } from "../genTypes/types";
import {
  findManyPayload,
  findOnePayload,
  mediaFields,
  metaFields,
  roleFields,
  userFields,
} from "../genTypes/constants";
import { destr } from "destr";

const constructImportLine = (model: string, quote: "'" | '"') =>
  `import { ${model} } from ${quote}./${_.camelCase(model)}${quote};`;

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
  generateTypeForAttribute: (attribute: StrapiAttribute): string => {
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
        const componentName = _.upperFirst(_.camelCase(attribute.component));
        if (attribute.repeatable) {
          return `${componentName}[] | null`;
        }
        return `${componentName} | null`;
      case "relation":
        // For relations, use the target to determine the type (model name)
        if (attribute.target) {
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
    isComponent = false
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
      const tsType = strapi.service(`plugin::${pluginName}.service`).generateTypeForAttribute(attribute);
      interfaceString += `  ${key}${attribute.required ? "" : "?"}: ${tsType};\n`;

      // Handle relations and add necessary imports
      if (attribute.type === "relation" && attribute.target) {
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
  generateInterfaceStrings: () => {
    const apiDir = `${process.cwd()}/src/api`;
    const componentsDir = `${process.cwd()}/src/components`;

    let schemaFiles = [];
    if (fs.existsSync(apiDir))
      schemaFiles = strapi.service(`plugin::${pluginName}.service`).walkDirectory(apiDir);
    let componentSchemaFiles = [];
    if (fs.existsSync(componentsDir))
      componentSchemaFiles = strapi.service(`plugin::${pluginName}.service`).walkDirectory(componentsDir);

    const holdingArray = new Map();
    componentSchemaFiles.forEach((schemaFile) => {
      const schemaJson = fs.readFileSync(schemaFile, "utf-8");
      const schema: StrapiSchema = destr(schemaJson);
      const modelName = path.basename(path.dirname(schemaFile)); // Use parent folder name as model name

      // Generate the TypeScript interface
      const { interfaceString, imports } = strapi
        .service(`plugin::${pluginName}.service`)
        .generateInterfaceFromSchema(modelName, schema, true);

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
        .generateInterfaceFromSchema(modelName, schema);

      const recordTitle = _.upperFirst(_.camelCase(modelName));

      // add to holding array
      holdingArray.set(recordTitle, interfaceString);
    });
    // Add other interfaces to the holding array
    holdingArray.set("Media", mediaFields);
    holdingArray.set("User", userFields);
    holdingArray.set("Role", roleFields);
    holdingArray.set("FindOnePayload", findOnePayload);
    holdingArray.set("FindManyPayload", findManyPayload);

    // return the map as an array
    return Object.fromEntries(holdingArray);
  },
  /**
   * Generate TypeScript interfaces from Strapi schema files
   */
  generateInterfaces: (outPath: string, singleFile: boolean, singleQuote: boolean = true) => {
    const apiDir = `${process.cwd()}/src/api`;
    const componentsDir = `${process.cwd()}/src/components`;
    const quoteSymbol = singleQuote ? `'` : `"`;
    let schemaFiles = [];
    if (fs.existsSync(apiDir))
      schemaFiles = strapi.service(`plugin::${pluginName}.service`).walkDirectory(apiDir);
    let componentSchemaFiles = [];
    if (fs.existsSync(componentsDir))
      componentSchemaFiles = strapi.service(`plugin::${pluginName}.service`).walkDirectory(componentsDir);

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
        .generateInterfaceFromSchema(modelName, schema, true);
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

        // Generate imports for the interface
        const importStatements = imports.map((model) => constructImportLine(model, quoteSymbol)).join("\n");

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
        .generateInterfaceFromSchema(modelName, schema);
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

        // Generate imports for the interface
        const importStatements = imports.map((model) => constructImportLine(model, quoteSymbol)).join("\n");

        const fileContent = `${importStatements}\n\n${interfaceString}`;
        fs.writeFileSync(outputFilePath, fileContent);
        strapi.log.info(`Generated interface for ${modelName} at ${outputFilePath}`);
      }
    });

    if (singleFile) {
      // Add mediaFields, userFields, roleFields, findOnePayload, and findManyPayload to the consolidated
      // interfaces file
      consolidatedInterfaces += `\n${mediaFields}\n${userFields}\n${roleFields}\n${findOnePayload}\n${findManyPayload}`;

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
        .filter(
          (model) => !consolidatedDeclaredModels.has(model) && !builtInDeclaredModels.has(model)
        )
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
      // Create the files for userFields, roleFields, findOnePayload, and findManyPayload
      // Add role import to userFields
      const roleImport = constructImportLine("Role", quoteSymbol) + "\n";

      fs.writeFileSync(path.resolve(outPath, "user.ts"), roleImport + userFields);
      fs.writeFileSync(path.resolve(outPath, "role.ts"), roleFields);
      fs.writeFileSync(path.resolve(outPath, "media.ts"), mediaFields);
      fs.writeFileSync(path.resolve(outPath, "findOnePayload.ts"), findOnePayload);
      fs.writeFileSync(path.resolve(outPath, "findManyPayload.ts"), findManyPayload);
    }
  },
});

export default service;
