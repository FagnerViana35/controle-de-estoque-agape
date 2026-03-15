import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Cookie, 
  BookOpen, 
  Factory, 
  Users, 
  ShoppingCart, 
  History,
  LogOut,
  Settings
} from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Agapé</h2>
          {user && <p style={{ fontSize: '12px', color: '#bdc3c7', marginTop: '5px' }}>Olá, {user.username}</p>}
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/">
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/raw-materials">
              <Package size={20} />
              <span>Matérias-Primas</span>
            </Link>
          </li>
          <li>
            <Link to="/products">
              <Cookie size={20} />
              <span>Produtos</span>
            </Link>
          </li>
          <li>
            <Link to="/recipes">
              <BookOpen size={20} />
              <span>Receitas</span>
            </Link>
          </li>
          <li>
            <Link to="/production">
              <Factory size={20} />
              <span>Produção</span>
            </Link>
          </li>
          <li>
            <Link to="/customers">
              <Users size={20} />
              <span>Clientes</span>
            </Link>
          </li>
          <li>
            <Link to="/sales">
              <ShoppingCart size={20} />
              <span>Vendas</span>
            </Link>
          </li>
          <li>
            <Link to="/stock-movements">
              <History size={20} />
              <span>Movimentações</span>
            </Link>
          </li>
          <li>
            <Link to="/profile">
              <Settings size={20} />
              <span>Configurações</span>
            </Link>
          </li>
          <li className="logout-item">
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        <header className="top-bar">
          <h1>Controle de Estoque - Agapé Delícias Caseiras</h1>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
