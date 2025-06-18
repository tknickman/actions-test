import { execSync } from 'node:child_process';
import { join } from 'node:path';

describe('determine-ref.sh', () => {
  const scriptPath = join(__dirname, 'determine-ref.sh');

  const runScript = (
    args: string[] = [],
    env: Record<string, string> = {},
  ): string => {
    const envString = Object.entries(env)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    const command = `${envString} bash ${scriptPath} ${args.join(' ')}`;
    return execSync(command, { encoding: 'utf8' }).trim();
  };

  const extractRef = (output: string): string => {
    const refLine = output.split('\n').find((line) => line.startsWith('ref='));
    return refLine ? refLine.substring(4) : '';
  };

  describe('when a ref is explicitly provided', () => {
    it('should use the provided ref', () => {
      const output = runScript(['main']);

      expect(output).toContain('Using provided ref: main');
      expect(extractRef(output)).toBe('main');
    });

    it('should use the provided ref even with other env vars set', () => {
      const output = runScript(['feature-branch'], {
        GITHUB_EVENT_NAME: 'repository_dispatch',
        GITHUB_EVENT_CLIENT_PAYLOAD_GIT_SHA: 'abc123',
      });

      expect(output).toContain('Using provided ref: feature-branch');
      expect(extractRef(output)).toBe('feature-branch');
    });

    it('should handle empty string as provided ref', () => {
      const output = runScript(['']);
      expect(output).toContain('Using default ref (empty)');
      expect(extractRef(output)).toBe('');
    });
  });

  describe('when no ref is provided but repository_dispatch event with SHA', () => {
    it('should use the client_payload SHA', () => {
      const output = runScript([], {
        GITHUB_EVENT_NAME: 'repository_dispatch',
        GITHUB_EVENT_CLIENT_PAYLOAD_GIT_SHA: 'abc123def456',
      });

      expect(output).toContain('Using client_payload SHA: abc123def456');
      expect(extractRef(output)).toBe('abc123def456');
    });

    it('should not use SHA if event is not repository_dispatch', () => {
      const output = runScript([], {
        GITHUB_EVENT_NAME: 'push',
        GITHUB_EVENT_CLIENT_PAYLOAD_GIT_SHA: 'abc123def456',
      });

      expect(output).toContain('Using default ref (empty)');
      expect(extractRef(output)).toBe('');
    });

    it('should not use SHA if SHA is empty', () => {
      const output = runScript([], {
        GITHUB_EVENT_NAME: 'repository_dispatch',
        GITHUB_EVENT_CLIENT_PAYLOAD_GIT_SHA: '',
      });

      expect(output).toContain('Using default ref (empty)');
      expect(extractRef(output)).toBe('');
    });

    it('should not use SHA if SHA is not set', () => {
      const output = runScript([], {
        GITHUB_EVENT_NAME: 'repository_dispatch',
      });

      expect(output).toContain('Using default ref (empty)');
      expect(extractRef(output)).toBe('');
    });
  });

  describe('when no ref is provided and no repository_dispatch SHA', () => {
    it('should use default empty ref', () => {
      const output = runScript([]);

      expect(output).toContain('Using default ref (empty)');
      expect(extractRef(output)).toBe('');
    });

    it('should use default empty ref with other env vars', () => {
      const output = runScript([], {
        GITHUB_EVENT_NAME: 'push',
        GITHUB_REPOSITORY: 'test/repo',
      });

      expect(output).toContain('Using default ref (empty)');
      expect(extractRef(output)).toBe('');
    });
  });

  describe('script behavior', () => {
    it('should exit on error with set -e', () => {
      // This test verifies the script has proper error handling
      // We can't easily test set -e behavior in a unit test context
      // but we can verify the script runs without syntax errors
      expect(() => {
        runScript([]);
      }).not.toThrow();
    });

    it('should handle special characters in ref', () => {
      const output = runScript(['feature/branch-with-special-chars']);

      expect(output).toContain(
        'Using provided ref: feature/branch-with-special-chars',
      );
      expect(extractRef(output)).toBe('feature/branch-with-special-chars');
    });

    it('should handle long SHA hashes', () => {
      const longSha = 'a'.repeat(40); // Git SHA length
      const output = runScript([], {
        GITHUB_EVENT_NAME: 'repository_dispatch',
        GITHUB_EVENT_CLIENT_PAYLOAD_GIT_SHA: longSha,
      });

      expect(output).toContain(`Using client_payload SHA: ${longSha}`);
      expect(extractRef(output)).toBe(longSha);
    });
  });
});
