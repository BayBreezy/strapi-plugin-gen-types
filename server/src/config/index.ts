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
};

export default {
  default: ({ env }) => ({
    outputLocation: env("GEN_TYPES_OUTPUT_LOCATION", "src/genTypes"),
    singleFile: env("GEN_TYPES_SINGLE_FILE", false),
  }),
  validator(config: GenTypesConfig) {
    if (!config.outputLocation) {
      throw new Error("OUTPUT_LOCATION is required for Gen Types to work");
    }
  },
};
