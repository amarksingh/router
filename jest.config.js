const tsJestPath = "/Users/amarkumarsingh/.nvm/versions/node/v24.12.0/lib/node_modules/ts-jest";

module.exports = {
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
        "^@ostro/support/(.*)$": "<rootDir>/../support/$1",
        "^@ostro/support$": "<rootDir>/../support",
        "^@ostro/contracts/(.*)$": "<rootDir>/../contracts/$1",
        "^@ostro/contracts$": "<rootDir>/../contracts",
        "^@ostro/console/(.*)$": "<rootDir>/../console/$1",
        "^@ostro/console$": "<rootDir>/../console",
        "^@ostro/http/(.*)$": "<rootDir>/../http/$1",
        "^@ostro/http$": "<rootDir>/../http",
        "^@ostro/cache/(.*)$": "<rootDir>/../cache/$1",
        "^@ostro/cache$": "<rootDir>/../cache",
        "^@ostro/router/(.*)$": "<rootDir>/$1",
        "^@ostro/router$": "<rootDir>/router.js"
    },
    "collectCoverage": true,
    "coverageDirectory": "coverage",
    "coverageReporters": [
        "text",
        "lcov",
        "clover"
    ],
    "collectCoverageFrom": [
        "<rootDir>/**/*.js",
        "!<rootDir>/node_modules/**",
        "!<rootDir>/test/**",
        "!<rootDir>/coverage/**",
        "!<rootDir>/jest.config.js"
    ]
};
