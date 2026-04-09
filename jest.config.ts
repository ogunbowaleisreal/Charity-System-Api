import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    clearMocks: true,
    restoreMocks: true,
    testMatch: ["**/__tests__/**/*.test.ts"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
};

export default config;
