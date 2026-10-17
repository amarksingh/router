const tsJestPath = "/Users/amarkumarsingh/.nvm/versions/node/v24.12.0/lib/node_modules/ts-jest";

export default {
    "testEnvironment": "node",
    "testMatch": [
        "**/test/**/*.test.ts",
        "**/test/**/*.test.js"
    ],
    "transform": {
        "^.+\\.ts$": [
            tsJestPath,
            {
                "tsconfig": "<rootDir>/tsconfig.json"
            }
        ]
    },
    "moduleNameMapper": {
        "^@ostro/support/(.*)$": "<rootDir>/../support/src/$1",
        "^@ostro/support$": "<rootDir>/../support/src",
        "^@ostro/contracts/(.*)$": "<rootDir>/../contracts/src/$1",
        "^@ostro/contracts$": "<rootDir>/../contracts/src",
        "^@ostro/console/(.*)$": "<rootDir>/../console/src/$1",
        "^@ostro/console$": "<rootDir>/../console/src/application",
        "^@ostro/http/(.*)$": "<rootDir>/../http/src/$1",
        "^@ostro/http$": "<rootDir>/../http/src/index",
        "^@ostro/cache/(.*)$": "<rootDir>/../cache/src/$1",
        "^@ostro/cache$": "<rootDir>/../cache/src",
        "^@ostro/router/(.*)$": "<rootDir>/src/$1",
        "^@ostro/router$": "<rootDir>/src/router"
    },
    "collectCoverage": true,
    "coverageDirectory": "coverage",
    "coverageReporters": [
        "text",
        "lcov",
        "clover"
    ],
    "collectCoverageFrom": [
        "<rootDir>/src/**/*.ts",
        "!<rootDir>/node_modules/**",
        "!<rootDir>/test/**",
        "!<rootDir>/coverage/**",
        "!<rootDir>/build/**"
    ],
    "modulePathIgnorePatterns": [
        "<rootDir>/build/"
    ]
};
