import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, User, Lock, CheckCircle } from 'lucide-react';

const Profile = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        const response = await api.get(`/users/${storedUser.id}`);
        setFormData({
          username: response.data.username,
          password: response.data.password,
          confirmPassword: response.data.password
        });
        setUserId(response.data.id);
      }
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err);
      setError('Erro ao carregar dados do perfil.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    try {
      await api.patch(`/users/${userId}`, {
        username: formData.username,
        password: formData.password
      });
      
      // Atualizar local storage
      localStorage.setItem('user', JSON.stringify({ id: userId, username: formData.username }));
      setSuccess('Perfil atualizado com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError('Erro ao salvar as alterações.');
    }
  };

  if (loading) return <div>Carregando perfil...</div>;

  return (
    <div className="profile-page">
      <div className="card">
        <h2>Configurações do Perfil</h2>
        <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
          Altere suas credenciais de acesso abaixo.
        </p>

        {success && (
          <div className="alert-success" style={{ 
            background: '#d4edda', 
            color: '#155724', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle size={18} /> {success}
          </div>
        )}

        {error && (
          <div className="alert-danger" style={{ 
            background: '#f8d7da', 
            color: '#721c24', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label><User size={18} /> Nome de Usuário</label>
            <input 
              type="text" 
              name="username" 
              value={formData.username} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label><Lock size={18} /> Nova Senha</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label><Lock size={18} /> Confirmar Nova Senha</label>
            <input 
              type="password" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleInputChange} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
            <Save size={18} /> Salvar Alterações
          </button>
        </form>
      </div>
      
      <div className="card" style={{ marginTop: '20px', background: '#f8f9fa' }}>
        <h3>Recuperação de Acesso</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Nota: Como este é um sistema local, se você esquecer sua senha e não conseguir entrar, 
          você pode resetá-la manualmente no arquivo <strong>db.json</strong> do projeto.
        </p>
      </div>
    </div>
  );
};

export default Profile;
