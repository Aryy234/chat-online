import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatRoom from '../ChatRoom';
import { Message, User } from '../../types';

// Mock para scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Variable para almacenar el mockSendMessage
const mockSendMessage = vi.fn();

// Mock de useSocket
vi.mock('../../context/SocketContext', () => {
  const mockMessages: Message[] = [
    {
      roomId: 'room123',
      message: 'Hola a todos',
      sender: 'sender1',
      senderName: 'Usuario1',
      timestamp: new Date()
    },
    {
      roomId: 'room123',
      message: 'Bienvenidos a la sala',
      sender: 'sender2',
      senderName: 'Usuario2',
      timestamp: new Date()
    }
  ];

  const mockUsers: User[] = [
    { id: 'sender1', name: 'Usuario1', roomId: 'room123' },
    { id: 'sender2', name: 'Usuario2', roomId: 'room123' }
  ];

  return {
    useSocket: () => ({
      messages: mockMessages,
      users: mockUsers,
      sendMessage: mockSendMessage
    })
  };
});

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
    expect(screen.getByText(`Sala: ${mockProps.roomId}`)).toBeInTheDocument();
    expect(screen.getByText('Jugadores (2)')).toBeInTheDocument();
    expect(screen.getByText(/Usuario1 \(Tú\)/)).toBeInTheDocument();
    
    // Usar el selector para encontrar específicamente el elemento en la lista de usuarios
    const usuarioEnLista = screen.getByText('Usuario2', { selector: 'li' });
    expect(usuarioEnLista).toBeInTheDocument();
  });

  it('debe mostrar los mensajes en la sala', () => {
    render(<ChatRoom {...mockProps} />);
    
    // Verificar que los mensajes se muestran
    expect(screen.getByText('Hola a todos')).toBeInTheDocument();
    expect(screen.getByText('Bienvenidos a la sala')).toBeInTheDocument();
  });

  it('debe permitir enviar un mensaje', () => {
    render(<ChatRoom {...mockProps} />);
    
    // Ingresar y enviar un mensaje
    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    fireEvent.change(input, { target: { value: 'Nuevo mensaje de prueba' } });
    
    const sendButton = screen.getByText('Enviar');
    fireEvent.click(sendButton);
    
    // Verificar que se llamó al método sendMessage con los parámetros correctos
    expect(mockSendMessage).toHaveBeenCalledWith(
      'room123',
      'Nuevo mensaje de prueba',
      'sender1',
      'Usuario1'
    );
  });

  it('debe llamar a onLeaveRoom cuando se hace clic en Salir', () => {
    render(<ChatRoom {...mockProps} />);
    
    const leaveButton = screen.getByText('Salir');
    fireEvent.click(leaveButton);
    
    expect(mockProps.onLeaveRoom).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar el código de sala para compartir', () => {
    render(<ChatRoom {...mockProps} />);
    
    const roomCodeText = screen.getByText(/Comparte este código para que otros jugadores se unan/i);
    expect(roomCodeText).toBeInTheDocument();
    
    const roomCode = screen.getByText('room123', { selector: 'strong' });
    expect(roomCode).toBeInTheDocument();
  });
}); 