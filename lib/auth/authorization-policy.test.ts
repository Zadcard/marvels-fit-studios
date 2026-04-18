import { describe, it, expect } from 'vitest';
import {
  getAuthorizationPolicy,
  getDashboardPolicy,
  getDashboardHomeForRole,
} from './authorization-policy';

describe('Authorization Policy', () => {
  describe('getAuthorizationPolicy', () => {
    it('should return public policy for root path', () => {
      const policy = getAuthorizationPolicy('/');
      expect(policy.area).toBe('public');
      expect(policy.requiresAuth).toBe(false);
      expect(policy.allowedRoles).toEqual([]);
      expect(policy.dashboardHref).toBeNull();
    });

    it('should return public policy for unknown routes', () => {
      const policy = getAuthorizationPolicy('/unknown/route');
      expect(policy.area).toBe('public');
      expect(policy.requiresAuth).toBe(false);
    });

    it('should return login policy for login route', () => {
      const policy = getAuthorizationPolicy('/login');
      expect(policy.area).toBe('login');
      expect(policy.requiresAuth).toBe(false);
    });

    it('should return api-auth policy for auth routes', () => {
      const policy = getAuthorizationPolicy('/api/auth/callback');
      expect(policy.area).toBe('api-auth');
      expect(policy.requiresAuth).toBe(false);
    });

    it('should return admin policy for admin routes', () => {
      const policy = getAuthorizationPolicy('/admin');
      expect(policy.area).toBe('admin');
      expect(policy.requiresAuth).toBe(true);
      expect(policy.allowedRoles).toEqual(['ADMIN']);
      expect(policy.dashboardHref).toBe('/admin');
    });

    it('should return admin policy for nested admin routes', () => {
      const policy = getAuthorizationPolicy('/admin/clients');
      expect(policy.area).toBe('admin');
      expect(policy.requiresAuth).toBe(true);
      expect(policy.allowedRoles).toEqual(['ADMIN']);
    });

    it('should return coach policy for coach routes', () => {
      const policy = getAuthorizationPolicy('/coach');
      expect(policy.area).toBe('coach');
      expect(policy.requiresAuth).toBe(true);
      expect(policy.allowedRoles).toEqual(['COACH']);
      expect(policy.dashboardHref).toBe('/coach');
    });

    it('should return coach policy for nested coach routes', () => {
      const policy = getAuthorizationPolicy('/coach/schedule');
      expect(policy.area).toBe('coach');
      expect(policy.requiresAuth).toBe(true);
      expect(policy.allowedRoles).toEqual(['COACH']);
    });

    it('should return client policy for client routes', () => {
      const policy = getAuthorizationPolicy('/client');
      expect(policy.area).toBe('client');
      expect(policy.requiresAuth).toBe(true);
      expect(policy.allowedRoles).toEqual(['CLIENT']);
      expect(policy.dashboardHref).toBe('/client');
    });

    it('should return client policy for nested client routes', () => {
      const policy = getAuthorizationPolicy('/client/sessions');
      expect(policy.area).toBe('client');
      expect(policy.requiresAuth).toBe(true);
      expect(policy.allowedRoles).toEqual(['CLIENT']);
    });
  });

  describe('getDashboardPolicy', () => {
    it('should return admin policy for admin role', () => {
      const policy = getDashboardPolicy('admin');
      expect(policy.area).toBe('admin');
      expect(policy.requiresAuth).toBe(true);
      expect(policy.allowedRoles).toEqual(['ADMIN']);
    });

    it('should return coach policy for coach role', () => {
      const policy = getDashboardPolicy('coach');
      expect(policy.area).toBe('coach');
      expect(policy.requiresAuth).toBe(true);
      expect(policy.allowedRoles).toEqual(['COACH']);
    });

    it('should return client policy for client role', () => {
      const policy = getDashboardPolicy('client');
      expect(policy.area).toBe('client');
      expect(policy.requiresAuth).toBe(true);
      expect(policy.allowedRoles).toEqual(['CLIENT']);
    });
  });

  describe('getDashboardHomeForRole', () => {
    it('should return /admin for admin role', () => {
      const home = getDashboardHomeForRole('admin');
      expect(home).toBe('/admin');
    });

    it('should return /coach for coach role', () => {
      const home = getDashboardHomeForRole('coach');
      expect(home).toBe('/coach');
    });

    it('should return /client for client role', () => {
      const home = getDashboardHomeForRole('client');
      expect(home).toBe('/client');
    });
  });
});
