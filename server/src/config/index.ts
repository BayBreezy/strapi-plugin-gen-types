/**
 * Config for Gen Types Plugin
 */
export type GenTypesConfig = {
  /**
   * The location where the generated types will be saved
   *
   * @default 'src/genTypes'
   */
  outputLocation: string;
  /**
   * Whether to generate a single file with all types or separate files
   *
   * If this is true, then the value for `outputLocation` will be treated as a file path instead of a directory path
   *
   * @default false
   */
  singleFile: boolean;
  /**
   * Whether to remove the output file/folder before generating types
   *
   * @default false
   */
  clearOutput?: boolean;
  /**
   * Glob patterns to include content types/components for generation
   *
   * Matches against: api::name.name or component::category.name
   */
  include?: string[];
  /**
   * Glob patterns to exclude content types/components for generation
   *
   * Matches against: api::name.name or component::category.name
   */
  exclude?: string[];
  /**
   * Extend built-in types with custom properties
   *
   * @example
   * extendTypes: {
   *   User: 'firstName?: string;\nlastName?: string;',
   *   Role: 'customField?: boolean;'
   * }
   */
  extendTypes?: {
    User?: string;
    Role?: string;
    Media?: string;
    MediaFormat?: string;
    FindOne?: string;
    FindMany?: string;
  };
  /**
   * Formatting options for generated files
   */
  prettier?: {
    /**
     * Use single quotes instead of double quotes in imports
     *
     * @default true
     */
    singleQuote?: boolean;
  };
};

export default {
  default: ({ env }) => ({
    outputLocation: env("GEN_TYPES_OUTPUT_LOCATION", "src/genTypes"),
    singleFile: env("GEN_TYPES_SINGLE_FILE", false),
    clearOutput: env("GEN_TYPES_CLEAR_OUTPUT", false),
    include: env("GEN_TYPES_INCLUDE", []),
    exclude: env("GEN_TYPES_EXCLUDE", []),
    extendTypes: {},
    prettier: {
      singleQuote: env("GEN_TYPES_SINGLE_QUOTE", true),
    },
  }),
  validator(config: GenTypesConfig) {
    if (!config.outputLocation) {
      throw new Error("OUTPUT_LOCATION is required for Gen Types to work");
    }
  },
};
