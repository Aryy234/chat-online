import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Lobby from '../Lobby';
import { SocketProvider } from '../../context/SocketContext';

// Mock para useSocket hook
vi.mock('../../context/SocketContext', () => ({
  useSocket: () => ({
    createRoom: vi.fn().mockResolvedValue({ roomId: 'abc123', userId: 'user123' }),
    joinRoom: vi.fn().mockResolvedValue({ success: true, users: [{ id: 'user1', name: 'Usuario1', roomId: 'abc123' }] }),
    connected: true
  }),
  SocketProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('Componente Lobby', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('debe renderizar el formulario de crear sala por defecto', () => {
    const mockJoinRoom = vi.fn();
    render(<Lobby onJoinRoom={mockJoinRoom} />);
    
    // Verificar que el título se muestra
    expect(screen.getByText('Juego de Mecanografía Multijugador')).toBeInTheDocument();
    
    // Verificar que el botón de crear sala está activo
    const toggleButton = screen.getAllByText('Crear Sala')[0]; // El botón de toggle
    expect(toggleButton).toHaveClass('active');
    
    // Verificar que se muestra el formulario de crear sala y no el de unirse
    expect(screen.queryByText('Código de sala:')).not.toBeInTheDocument();
    const submitButton = screen.getByText('Crear Sala', { selector: 'button.submit-btn' });
    expect(submitButton).toBeInTheDocument();
  });

  it('debe cambiar entre formularios de crear y unirse', () => {
    const mockJoinRoom = vi.fn();
    render(<Lobby onJoinRoom={mockJoinRoom} />);
    
    // Por defecto, debería mostrar el formulario de crear sala
    expect(screen.queryByText('Código de sala:')).not.toBeInTheDocument();
    
    // Hacer clic en "Unirse a Sala"
    const toggleButton = screen.getByText('Unirse a Sala');
    fireEvent.click(toggleButton);
    
    // Ahora debería mostrar el formulario de unirse
    expect(screen.getByText('Código de sala:')).toBeInTheDocument();
    expect(screen.getByText('Unirse a Sala', { selector: 'button.submit-btn' })).toBeInTheDocument();
  });

  it('debe mostrar error si no se ingresa un nombre de usuario al crear sala', async () => {
    const mockJoinRoom = vi.fn();
    render(<Lobby onJoinRoom={mockJoinRoom} />);
    
    // Intentar crear sala sin nombre de usuario
    const createButton = screen.getByText('Crear Sala', { selector: 'button.submit-btn' });
    fireEvent.click(createButton);
    
    // Verificar que se muestra el mensaje de error
    expect(screen.getByText('Por favor, ingresa un nombre de usuario')).toBeInTheDocument();
    expect(mockJoinRoom).not.toHaveBeenCalled();
  });

  it('debe llamar a onJoinRoom cuando se crea una sala con éxito', async () => {
    const mockJoinRoom = vi.fn();
    render(<Lobby onJoinRoom={mockJoinRoom} />);
    
    // Ingresar nombre de usuario
    const usernameInput = screen.getByPlaceholderText('Ingresa tu nombre');
    fireEvent.change(usernameInput, { target: { value: 'TestUser' } });
    
    // Crear sala
    const createButton = screen.getByText('Crear Sala', { selector: 'button.submit-btn' });
    fireEvent.click(createButton);
    
    // Esperar a que se procese la promesa
    await vi.waitFor(() => {
      expect(mockJoinRoom).toHaveBeenCalledWith('abc123', 'TestUser', 'user123');
    });
  });
}); 