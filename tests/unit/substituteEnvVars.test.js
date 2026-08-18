const { substituteEnvVars } = require('../../background.js');

const VARS = [
  { name: 'host', defaultValue: 'default.example.com' },
  { name: 'port', defaultValue: '8080' }
];

const ENVS = [
  {
    id: 'env-prod',
    name: 'Production',
    values: [
      { key: 'host', value: 'prod.example.com' },
      { key: 'port', value: '443' }
    ]
  },
  {
    id: 'env-dev',
    name: 'Development',
    values: [
      { key: 'host', value: 'dev.example.com' }
    ]
  }
];

describe('substituteEnvVars', () => {
  describe('environment-specific substitution', () => {
    test('replaces {{host}} with environment value when env exists', () => {
      const result = substituteEnvVars('https://{{host}}/search?q=%s', 'env-prod', VARS, ENVS);
      expect(result).toBe('https://prod.example.com/search?q=%s');
    });

    test('replaces multiple variables in a single URL', () => {
      const result = substituteEnvVars('https://{{host}}:{{port}}/path', 'env-prod', VARS, ENVS);
      expect(result).toBe('https://prod.example.com:443/path');
    });
  });

  describe('default value fallback', () => {
    test('falls back to defaultValue when env has no value for the variable', () => {
      const result = substituteEnvVars('https://{{host}}:{{port}}', 'env-dev', VARS, ENVS);
      expect(result).toBe('https://dev.example.com:8080');
    });

    test('falls back to defaultValue when envId is NO_ENV', () => {
      const result = substituteEnvVars('https://{{host}}/q=%s', 'NO_ENV', VARS, ENVS);
      expect(result).toBe('https://default.example.com/q=%s');
    });

    test('falls back to empty string when variable has no defaultValue', () => {
      const vars = [{ name: 'token', defaultValue: '' }];
      const result = substituteEnvVars('Bearer {{token}}', 'NO_ENV', vars, []);
      expect(result).toBe('Bearer ');
    });
  });

  describe('unknown variable handling', () => {
    test('leaves unknown placeholder unchanged when variable is not defined', () => {
      const result = substituteEnvVars('https://{{unknown}}/path', 'env-prod', VARS, ENVS);
      expect(result).toBe('https://{{unknown}}/path');
    });
  });

  describe('no placeholders', () => {
    test('returns the URL unchanged when it has no {{}} placeholders', () => {
      const url = 'https://github.com/search?q=%s';
      expect(substituteEnvVars(url, 'env-prod', VARS, ENVS)).toBe(url);
    });
  });

  describe('whitespace in variable name', () => {
    test('trims whitespace around variable name in placeholder', () => {
      const result = substituteEnvVars('https://{{ host }}/q', 'env-prod', VARS, ENVS);
      expect(result).toBe('https://prod.example.com/q');
    });
  });
});
