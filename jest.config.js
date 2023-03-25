module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ["./jest.setup.ts"],
  transformIgnorePatterns: ["/node_modules/(?!lit-html).+\\.js"],
};