import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Settings,
  Menu,
  X
} from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Overlay para fechar o menu no mobile */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <nav className={`sidebar ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-area">
            <h2>Ágape</h2>
            <button className="close-sidebar-btn" onClick={closeSidebar}>
              <X size={24} />
            </button>
          </div>
          {user && <p className="user-welcome">Olá, {user.username}</p>}
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/" onClick={closeSidebar} className={isActive('/') ? 'active' : ''}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link to="/raw-materials" onClick={closeSidebar} className={isActive('/raw-materials') ? 'active' : ''}>
              <Package size={20} />
              <span>Matérias-Primas</span>
            </Link>
          </li>
          <li>
            <Link to="/products" onClick={closeSidebar} className={isActive('/products') ? 'active' : ''}>
              <Cookie size={20} />
              <span>Produtos</span>
            </Link>
          </li>
          <li>
            <Link to="/recipes" onClick={closeSidebar} className={isActive('/recipes') ? 'active' : ''}>
              <BookOpen size={20} />
              <span>Receitas</span>
            </Link>
          </li>
          <li>
            <Link to="/production" onClick={closeSidebar} className={isActive('/production') ? 'active' : ''}>
              <Factory size={20} />
              <span>Produção</span>
            </Link>
          </li>
          <li>
            <Link to="/customers" onClick={closeSidebar} className={isActive('/customers') ? 'active' : ''}>
              <Users size={20} />
              <span>Clientes</span>
            </Link>
          </li>
          <li>
            <Link to="/sales" onClick={closeSidebar} className={isActive('/sales') ? 'active' : ''}>
              <ShoppingCart size={20} />
              <span>Vendas</span>
            </Link>
          </li>
          <li>
            <Link to="/stock-movements" onClick={closeSidebar} className={isActive('/stock-movements') ? 'active' : ''}>
              <History size={20} />
              <span>Movimentações</span>
            </Link>
          </li>
          <li>
            <Link to="/profile" onClick={closeSidebar} className={isActive('/profile') ? 'active' : ''}>
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
          <button className="menu-toggle-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <h1 className="page-title">Ágape Delícias Caseiras</h1>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
