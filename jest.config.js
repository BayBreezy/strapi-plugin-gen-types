module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/server/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "server/tsconfig.json" }],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
};
