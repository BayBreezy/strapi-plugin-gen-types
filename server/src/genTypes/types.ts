interface VisibleMatch {
  "==": [{ var: string }, boolean];
}

interface VisibleIsNotMatch {
  "!=": [{ var: string }, boolean];
}

interface Conditions {
  visible: VisibleMatch | VisibleIsNotMatch;
}

export type StrapiAttribute = {
  type: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  target?: string; // To specify the related model for relations
  relation?: string; // Type of relation (oneToMany, manyToOne, etc.)
  mappedBy?: string;
  inversedBy?: string;
  multiple?: boolean;
  repeatable?: boolean;
  component?: string;
  conditions?: Conditions;
};

export interface StrapiSchema {
  attributes: Record<string, StrapiAttribute>;
}

/**
 * The name of the plugin
 */
export const pluginName = "gen-types";
