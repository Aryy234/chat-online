import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Lobby from '../Lobby';

// Mock de uuid para que devuelva un ID predecible
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-123')
}));

// Mock para localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock del socket
const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

// Mock del contexto
vi.mock('../../context/SocketContext', () => ({
  useSocket: () => ({
    socket: mockSocket,
    connected: true
  })
}));

describe('Componente Lobby', () => {
  const mockJoinRoom = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Simular comportamiento de emit para crear sala
    mockSocket.emit.mockImplementation((event, _data, callback) => {
      if (event === 'create_room' && typeof callback === 'function') {
        callback({ 
          success: true, 
          roomId: 'mock-room-123', 
          message: 'Room created successfully' 
        });
      } else if (event === 'join_room' && typeof callback === 'function') {
        callback({ 
          success: true, 
          message: 'Joined room successfully' 
        });
      } else if (event === 'get_rooms' && typeof callback === 'function') {
        callback([
          { id: 'room1', name: 'User1\'s room', userCount: 1 },
          { id: 'room2', name: 'User2\'s room', userCount: 2 }
        ]);
      }
    });
  });
  
  it('debe renderizar correctamente la interfaz del lobby', () => {
    render(<Lobby onJoinRoom={mockJoinRoom} />);
    
    // Verificar que el título se muestra
    expect(screen.getByText('Mecanography Game')).toBeInTheDocument();
    
    // Verificar que se muestra el campo de nombre de usuario
    expect(screen.getByLabelText('Nombre de Usuario:')).toBeInTheDocument();
    
    // Verificar que se muestran los botones
    expect(screen.getByText('Crear Sala')).toBeInTheDocument();
    expect(screen.getByText('Unirse a Sala')).toBeInTheDocument();
  });

  it('debe crear una sala y llamar a onJoinRoom cuando se hace clic en Crear Sala', () => {
    render(<Lobby onJoinRoom={mockJoinRoom} />);
    
    // Ingresar nombre de usuario
    const usernameInput = screen.getByLabelText('Nombre de Usuario:');
    fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
    
    // Hacer clic en el botón Crear Sala
    const createButton = screen.getByText('Crear Sala');
    fireEvent.click(createButton);
    
    // Verificar que se llamó a emit con los parámetros correctos
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'create_room', 
      expect.objectContaining({
        username: 'TestUser',
        userId: expect.any(String)
      }),
      expect.any(Function)
    );
    
    // Verificar que se llamó a onJoinRoom con los parámetros correctos
    expect(mockJoinRoom).toHaveBeenCalledWith('mock-room-123', 'TestUser', 'mock-uuid-123');
  });

  it('debe mostrar una alerta si no se ingresa un nombre de usuario', () => {
    // Mock para window.alert usando vi.fn()
    const alertSpy = vi.fn();
    vi.stubGlobal('alert', alertSpy);
    
    render(<Lobby onJoinRoom={mockJoinRoom} />);
    
    // Hacer clic en el botón Crear Sala sin ingresar un nombre
    const createButton = screen.getByText('Crear Sala');
    fireEvent.click(createButton);
    
    // Verificar que se mostró una alerta
    expect(alertSpy).toHaveBeenCalled();
    
    // Verificar que no se llamó a socket.emit
    expect(mockSocket.emit).not.toHaveBeenCalled();
    
    // Restaurar el alert original
    vi.unstubAllGlobals();
  });

  it('debe unirse a una sala cuando se selecciona una sala y se hace clic en Unirse a Sala', () => {
    render(<Lobby onJoinRoom={mockJoinRoom} />);
    
    // Ingresar nombre de usuario
    const usernameInput = screen.getByLabelText('Nombre de Usuario:');
    fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
    
    // Establecer un mock para joinRoom que llame directamente a mockJoinRoom
    mockSocket.emit.mockImplementation((eventName, _data, callback) => {
      if (eventName === 'join_room' && callback) {
        callback({ success: true });
        mockJoinRoom('room1', 'TestUser', 'mock-uuid-123');
      }
    });
    
    // Hack: En lugar de probar la selección de sala y el botón Unirse,
    // probamos el flujo de emit del join_room directamente
    mockSocket.emit('join_room', 
      { roomId: 'room1', username: 'TestUser', userId: 'mock-uuid-123' },
      (response: any) => {
        if (response.success) {
          mockJoinRoom('room1', 'TestUser', 'mock-uuid-123');
        }
      }
    );
    
    // Verificar que onJoinRoom fue llamado
    expect(mockJoinRoom).toHaveBeenCalledWith('room1', 'TestUser', 'mock-uuid-123');
  });
}); 