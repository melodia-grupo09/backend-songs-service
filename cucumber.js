const common = [
  'test/**/*.feature',
  '--require test/step-definitions/**/*.ts',
  '--require-module ts-node/register',
  '--format @cucumber/pretty-formatter',
  '--format summary',
].join(' ');

module.exports = {
  default: common,
  timeout: 30000,
};