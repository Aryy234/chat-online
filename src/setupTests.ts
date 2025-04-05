import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Configuración global para pruebas
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock para scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock para Socket.IO
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn()
  };
  return {
    io: vi.fn(() => mockSocket)
  };
}); 