import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Cookie, ShoppingCart, TrendingUp, History, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRawMaterials: 0,
    totalProducts: 0,
    salesSelectedDate: 0,
    salesMonth: 0,
    recentMovements: [],
    soldProducts: [],
    totalPagesMovements: 1
  });
  const [loading, setLoading] = useState(true);
  
  // Estados para filtros e paginação
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [movementDate, setMovementDate] = useState('');
  const [movementPage, setMovementPage] = useState(1);
  const movementsPerPage = 5;

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate, movementDate, movementPage]);

  const fetchDashboardData = async () => {
    try {
      // Construir query para movimentações
      let movUrl = `/stock-movements?_sort=-date&_page=${movementPage}&_per_page=${movementsPerPage}`;
      if (movementDate) {
        // Filtragem por data no backend (se suportado) ou apenas carregar para filtrar localmente
        // Como o backend usa Knex, podemos passar o filtro
        movUrl += `&date_like=${movementDate}`; 
      }

      const [matRes, prodRes, saleRes, movRes, itemRes] = await Promise.all([
        api.get('/raw-materials'),
        api.get('/products'),
        api.get('/sales'),
        api.get(movUrl),
        api.get('/sale-items')
      ]);

      const currentMonth = new Date().toISOString().slice(0, 7);

      // Vendas do dia selecionado
      const salesOnDate = (Array.isArray(saleRes.data) ? saleRes.data : saleRes.data.data || [])
        .filter(s => s.sale_date.startsWith(selectedDate));
      
      const salesValueSelectedDate = salesOnDate.reduce((sum, s) => sum + Number(s.total_value), 0);

      const salesMonth = (Array.isArray(saleRes.data) ? saleRes.data : saleRes.data.data || [])
        .filter(s => s.sale_date.startsWith(currentMonth))
        .reduce((sum, s) => sum + Number(s.total_value), 0);

      // Agrupar produtos vendidos no dia selecionado
      const soldMap = {};
      const allSaleItems = Array.isArray(itemRes.data) ? itemRes.data : itemRes.data.data || [];
      const allProducts = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.data || [];

      // Filtrar itens de venda apenas das vendas do dia selecionado
      const saleIdsOnDate = salesOnDate.map(s => String(s.id));
      const itemsOnDate = allSaleItems.filter(item => saleIdsOnDate.includes(String(item.sale_id)));

      itemsOnDate.forEach(item => {
        if (!soldMap[item.product_id]) {
          const prod = allProducts.find(p => p.id === item.product_id);
          soldMap[item.product_id] = {
            name: prod ? prod.name : 'Desconhecido',
            quantity: 0
          };
        }
        soldMap[item.product_id].quantity += Number(item.quantity);
      });

      const soldProducts = Object.values(soldMap).sort((a, b) => b.quantity - a.quantity);

      // Tratar resposta de movimentações (paginada)
      const movData = movRes.data;
      const recentMovements = movData.data || (Array.isArray(movData) ? movData : []);
      const totalPagesMovements = movData.pages || 1;

      setStats({
        totalRawMaterials: Array.isArray(matRes.data) ? matRes.data.length : (matRes.data.items || 0),
        totalProducts: allProducts.reduce((sum, p) => sum + Number(p.stock_quantity), 0),
        salesSelectedDate: salesValueSelectedDate,
        salesMonth,
        recentMovements,
        soldProducts,
        totalPagesMovements
      });
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= stats.totalPagesMovements) {
      setMovementPage(newPage);
    }
  };

  if (loading && stats.recentMovements.length === 0) return <div>Carregando dashboard...</div>;

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
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            Vendas {selectedDate === new Date().toISOString().split('T')[0] ? 'Hoje' : 'em ' + new Date(selectedDate + 'T00:00:00').toLocaleDateString()}
          </h3>
          <div className="value">R$ {stats.salesSelectedDate.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <ShoppingCart size={32} color="#e74c3c" />
          <h3>Vendas Mês</h3>
          <div className="value">R$ {stats.salesMonth.toFixed(2)}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cookie size={20} /> Produtos Vendidos
          </h2>
          <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} color="#666" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>
        
        <div className="table-responsive" style={{ marginTop: '15px' }}>
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade Vendida</th>
              </tr>
            </thead>
            <tbody>
              {stats.soldProducts.map((p, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                  <td>{p.quantity} un</td>
                </tr>
              ))}
              {stats.soldProducts.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhuma venda registrada para esta data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} /> Últimas Movimentações
          </h2>
          <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} color="#666" />
            <input 
              type="date" 
              value={movementDate} 
              onChange={(e) => {
                setMovementDate(e.target.value);
                setMovementPage(1);
              }}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            {movementDate && (
              <button 
                className="btn btn-secondary" 
                onClick={() => setMovementDate('')}
                style={{ padding: '5px 10px', minWidth: 'auto' }}
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive" style={{ marginTop: '15px' }}>
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
                  <td>{new Date(mov.date).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${mov.type.includes('entrada') || mov.type.includes('estorno') ? 'text-success' : 'text-danger'}`}>
                      {mov.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ color: Number(mov.quantity) > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    {Number(mov.quantity) > 0 ? `+${mov.quantity}` : mov.quantity}
                  </td>
                </tr>
              ))}
              {stats.recentMovements.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação de Movimentações */}
        {stats.totalPagesMovements > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => handlePageChange(movementPage - 1)}
              disabled={movementPage === 1}
              style={{ minWidth: 'auto', padding: '8px' }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <span style={{ fontWeight: 'bold' }}>
              Página {movementPage} de {stats.totalPagesMovements}
            </span>

            <button 
              className="btn btn-secondary" 
              onClick={() => handlePageChange(movementPage + 1)}
              disabled={movementPage === stats.totalPagesMovements}
              style={{ minWidth: 'auto', padding: '8px' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
