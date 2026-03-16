import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Cookie, ShoppingCart, TrendingUp, History } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRawMaterials: 0,
    totalProducts: 0,
    salesToday: 0,
    salesMonth: 0,
    recentMovements: [],
    soldProducts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [matRes, prodRes, saleRes, movRes, itemRes] = await Promise.all([
        api.get('/raw-materials'),
        api.get('/products'),
        api.get('/sales'),
        api.get('/stock-movements?_sort=-date&_per_page=5'),
        api.get('/sale-items')
      ]);

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7);

      const salesToday = saleRes.data
        .filter(s => s.sale_date.startsWith(today))
        .reduce((sum, s) => sum + s.total_value, 0);

      const salesMonth = saleRes.data
        .filter(s => s.sale_date.startsWith(currentMonth))
        .reduce((sum, s) => sum + s.total_value, 0);

      // Agrupar produtos vendidos
      const soldMap = {};
      itemRes.data.forEach(item => {
        if (!soldMap[item.product_id]) {
          const prod = prodRes.data.find(p => p.id === item.product_id);
          soldMap[item.product_id] = {
            name: prod ? prod.name : 'Desconhecido',
            quantity: 0
          };
        }
        soldMap[item.product_id].quantity += item.quantity;
      });

      const soldProducts = Object.values(soldMap).sort((a, b) => b.quantity - a.quantity);

      setStats({
        totalRawMaterials: matRes.data.length,
        totalProducts: prodRes.data.reduce((sum, p) => sum + p.stock_quantity, 0),
        salesToday,
        salesMonth,
        recentMovements: movRes.data.data || movRes.data, // JSON Server 1.0 returns { data, first, prev, next, last, pages, items } for paginated results
        soldProducts
      });
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  if (loading) return <div>Carregando dashboard...</div>;

  return (
    <div>
      <div className="dashboard-grid">
        <div className="stat-card">
          <Package size={32} color="#3498db" />
          <h3>Matérias-Primas</h3>
          <div className="value">{stats.totalRawMaterials} tipos</div>
        </div>
        <div className="stat-card">
          <Cookie size={32} color="#27ae60" />
          <h3>Produtos em Estoque</h3>
          <div className="value">{stats.totalProducts} un</div>
        </div>
        <div className="stat-card">
          <TrendingUp size={32} color="#f1c40f" />
          <h3>Vendas Hoje</h3>
          <div className="value">R$ {stats.salesToday.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <ShoppingCart size={32} color="#e74c3c" />
          <h3>Vendas Mês</h3>
          <div className="value">R$ {stats.salesMonth.toFixed(2)}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h2><Cookie size={20} style={{ marginRight: '10px' }} /> Produtos Vendidos</h2>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Total Vendido</th>
              </tr>
            </thead>
            <tbody>
              {stats.soldProducts.map((p, index) => (
                <tr key={index}>
                  <td>{p.name}</td>
                  <td>{p.quantity} un</td>
                </tr>
              ))}
              {stats.soldProducts.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center' }}>Nenhuma venda registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <h2><History size={20} style={{ marginRight: '10px' }} /> Últimas Movimentações</h2>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentMovements.map(mov => (
                <tr key={mov.id}>
                  <td>{new Date(mov.date).toLocaleDateString()}</td>
                  <td>{mov.type.toUpperCase()}</td>
                  <td style={{ color: mov.quantity > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                  </td>
                </tr>
              ))}
              {stats.recentMovements.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center' }}>Nenhuma movimentação recente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
