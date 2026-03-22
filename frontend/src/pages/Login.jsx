import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Cookie } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Busca usuário pelo username
      const response = await api.get(`/users?username=${username}`);
      const user = response.data[0];

      if (user && user.password === password) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({ id: user.id, username: user.username }));
        navigate('/');
      } else {
        setError('Usuário ou senha inválidos!');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Cookie size={48} color="#2c3e50" />
          </div>
          <h1>Ágape</h1>
          <p>Delícias Caseiras</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="login-input-group">
            <label><User size={18} /> Usuário</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Digite seu usuário"
              required
            />
          </div>
          
          <div className="login-input-group">
            <label><Lock size={18} /> Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Digite sua senha"
              required
            />
          </div>
          
          <button type="submit" className="login-btn">Entrar</button>
        </form>
        
        <div className="login-footer">
          <p>&copy; 2026 Ágape Delícias Caseiras</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
