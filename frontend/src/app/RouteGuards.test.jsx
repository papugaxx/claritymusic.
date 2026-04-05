

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const authState = vi.hoisted(() => ({
  value: {
    me: null,
    loading: false,
  },
}));

vi.mock('../hooks/useAuth.jsx', () => ({
  useAuth: () => authState.value,
}));

import { RequireAdmin, RequireAuth } from './RouteGuards.jsx';

// Функція нижче інкапсулює окрему частину логіки цього модуля
function renderRoutes(guardElement) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/protected" element={guardElement} />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/app" element={<div>App page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RouteGuards', () => {
  beforeEach(() => {
    authState.value = { me: null, loading: false };
  });

  it('shows a loading gate while auth state is loading', () => {
    authState.value = { me: null, loading: true };

    renderRoutes(
      <RequireAuth>
        <div>Protected page</div>
      </RequireAuth>,
    );

    expect(screen.getByText('Завантаження…')).toBeTruthy();
  });

  it('redirects guests to the login page', () => {
    renderRoutes(
      <RequireAuth>
        <div>Protected page</div>
      </RequireAuth>,
    );

    expect(screen.getByText('Login page')).toBeTruthy();
  });

  it('renders protected content for authenticated users', () => {
    authState.value = {
      me: { isAuthenticated: true, roles: ['User'] },
      loading: false,
    };

    renderRoutes(
      <RequireAuth>
        <div>Protected page</div>
      </RequireAuth>,
    );

    expect(screen.getByText('Protected page')).toBeTruthy();
  });

  it('redirects a non-admin user away from admin routes', () => {
    authState.value = {
      me: { isAuthenticated: true, roles: ['User'] },
      loading: false,
    };

    renderRoutes(
      <RequireAdmin>
        <div>Admin page</div>
      </RequireAdmin>,
    );

    expect(screen.getByText('App page')).toBeTruthy();
  });

  it('allows admin users into admin routes', () => {
    authState.value = {
      me: { isAuthenticated: true, roles: ['Admin'] },
      loading: false,
    };

    renderRoutes(
      <RequireAdmin>
        <div>Admin page</div>
      </RequireAdmin>,
    );

    expect(screen.getByText('Admin page')).toBeTruthy();
  });
});
