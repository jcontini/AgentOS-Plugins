/**
 * Hardcover Connector Tests
 * 
 * Tests connector configuration and readme action.
 * Note: Live API tests require HARDCOVER_API_KEY environment variable.
 */

import { describe, it, expect } from 'vitest';
import { aos } from '../../../tests/utils/fixtures';

describe('Hardcover Connector', () => {
  describe('Configuration', () => {
    it('has readme with actions', async () => {
      const result = await aos().call('Connect', {
        connector: 'hardcover',
        action: 'readme'
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('hardcover');
    });

    it('supports search action', async () => {
      const result = await aos().call('Connect', {
        connector: 'hardcover',
        action: 'readme'
      });

      // The readme should mention search functionality
      expect(result).toContain('search');
    });

    it('supports pull action', async () => {
      const result = await aos().call('Connect', {
        connector: 'hardcover',
        action: 'readme'
      });

      expect(result).toContain('pull');
    });

    it('supports create action', async () => {
      const result = await aos().call('Connect', {
        connector: 'hardcover',
        action: 'readme'
      });

      expect(result).toContain('create');
    });

    it('lists hardcover as a connector', async () => {
      const result = await aos().call('Connect', {
        connector: 'hardcover',
        action: 'readme'
      });

      // Hardcover should be listed as a connector option
      expect(result).toContain('Hardcover');
    });
  });
});
