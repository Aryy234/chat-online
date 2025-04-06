import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatRoom from '../ChatRoom';

// Mock para scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

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
    messages: [
      {
        id: 'msg1',
        roomId: 'room123',
        text: 'Hola a todos',
        userId: 'sender1',
        username: 'Usuario1',
        timestamp: new Date().toISOString()
      },
      {
        id: 'msg2',
        roomId: 'room123',
        text: 'Bienvenidos a la sala',
        userId: 'sender2',
        username: 'Usuario2',
        timestamp: new Date().toISOString()
      }
    ],
    users: [
      { id: 'sender1', username: 'Usuario1' },
      { id: 'sender2', username: 'Usuario2' }
    ],
    connected: true
  })
}));

describe('Componente ChatRoom', () => {
  const mockProps = {
    roomId: 'room123',
    username: 'Usuario1',
    userId: 'sender1',
    onLeaveRoom: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar correctamente el componente de sala de chat', () => {
    render(<ChatRoom {...mockProps} />);
    
    // Verificar elementos clave de la UI
    expect(screen.getByText(/Sala:/)).toBeInTheDocument();
    expect(screen.getByText('Jugadores (2)')).toBeInTheDocument();
    
    // Verificar usuarios en la lista
    const usuarios = screen.getAllByRole('listitem');
    expect(usuarios.length).toBe(2);
    expect(usuarios[0]).toHaveTextContent('Usuario1');
    expect(usuarios[1]).toHaveTextContent('Usuario2');
  });

  it('debe permitir enviar un mensaje', () => {
    render(<ChatRoom {...mockProps} />);
    
    // Ingresar y enviar un mensaje
    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    fireEvent.change(input, { target: { value: 'Nuevo mensaje de prueba' } });
    
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    fireEvent.click(sendButton);
    
    // Verificar que se llamó al método emit del socket con los parámetros correctos
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'send_message',
      expect.objectContaining({
        roomId: 'room123',
        messageText: 'Nuevo mensaje de prueba',
        userId: 'sender1',
        username: 'Usuario1'
      })
    );
    
    // Verificar que el input se limpió
    expect(input).toHaveValue('');
  });

  it('debe llamar a onLeaveRoom cuando se hace clic en Salir', () => {
    render(<ChatRoom {...mockProps} />);
    
    // Configurar el comportamiento del mock para devolver una respuesta exitosa
    mockSocket.emit.mockImplementation((event, _data, callback) => {
      if (event === 'leave_room' && typeof callback === 'function') {
        callback({ success: true });
      }
    });
    
    const leaveButton = screen.getByText('Salir');
    fireEvent.click(leaveButton);
    
    expect(mockProps.onLeaveRoom).toHaveBeenCalledTimes(1);
  });

  it('debe permitir enviar un mensaje de prueba', () => {
    render(<ChatRoom {...mockProps} />);
    
    const testButton = screen.getByText('Enviar Prueba');
    fireEvent.click(testButton);
    
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'send_message',
      expect.objectContaining({
        roomId: 'room123',
        messageText: expect.any(String),
        userId: 'sender1',
        username: 'Usuario1'
      })
    );
  });
}); 