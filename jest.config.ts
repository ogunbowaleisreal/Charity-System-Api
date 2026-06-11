import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",

    setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

    testMatch: ["**/tests/**/*.test.ts"],

    moduleFileExtensions: ["ts", "js", "json"],

    clearMocks: true,
    verbose: true,
};

export default config;
// import type { Config } from "jest";

// const config: Config = {
//     preset: "ts-jest",
//     testEnvironment: "node",
//     clearMocks: true,
//     restoreMocks: true,
//     testMatch: ["**/__tests__/**/*.test.ts"],
//     setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
// };

// export default config;
