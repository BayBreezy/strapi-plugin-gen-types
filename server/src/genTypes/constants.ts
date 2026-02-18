/**
 * The fields that are usually always added to the top of a model
 */
export const metaFields = `
  id?: number;
  documentId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  publishedAt?: Date | string;
  locale?: string | null;
`;

/**
 * The shape of the default strapi user
 */
export const buildUserFields = (customFields?: string): string => `export interface User {
  id?: number;
  username: string;
  email: string;
  provider?: string;
  confirmed?: boolean;
  blocked?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  role: Role | null | number;${customFields ? `\n  ${customFields}` : ""}
};
`;

export const userFields = buildUserFields();

/**
 * The shape of the default strapi role
 */
export const buildRoleFields = (customFields?: string): string => `export interface Role {
  id?: number;
  documentId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  name: string;
  description: string;
  type: string;${customFields ? `\n  ${customFields}` : ""}
};
`;

export const roleFields = buildRoleFields();

/**
 * The shape of the payload returned from a findOne query
 */
export const buildFindOnePayload = (customFields?: string): string => `export interface FindOne<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };${customFields ? `\n  ${customFields}` : ""}
};
`;

export const findOnePayload = buildFindOnePayload();

/**
 * The shape of the payload returned from a findMany query
 */
export const buildFindManyPayload = (customFields?: string): string => `export interface FindMany<T> {
  data: T[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };${customFields ? `\n  ${customFields}` : ""}
};
`;

export const findManyPayload = buildFindManyPayload();

export const buildMediaFields = (customFields?: string): string => `export interface Media {
  id: number;
  name: string;
  alternativeText: string;
  caption: string;
  width: number;
  height: number;
  formats: { thumbnail: MediaFormat; small: MediaFormat; medium: MediaFormat; large: MediaFormat; };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;${customFields ? `\n  ${customFields}` : ""}
}
`;

export const buildMediaFormatFields = (customFields?: string): string => `export interface MediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  path: string;
  url: string;${customFields ? `\n  ${customFields}` : ""}
}
`;

export const mediaFields = buildMediaFields() + "\n" + buildMediaFormatFields();
