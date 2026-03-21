import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, History, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [currentPage, selectedItem, searchTerm]); // Recarregar quando página ou filtros mudarem

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Construir query string para paginação e filtros
      let movUrl = `/stock-movements?_sort=-date&_page=${currentPage}&_per_page=${itemsPerPage}`;
      
      // Se houver item selecionado, filtramos por ele no backend
      if (selectedItem) {
        const filterParam = selectedItem.category === 'product' ? 'product_id' : 'raw_material_id';
        movUrl += `&${filterParam}=${selectedItem.id}`;
      }

      const [movRes, prodRes, matRes] = await Promise.all([
        api.get(movUrl),
        api.get('/products'),
        api.get('/raw-materials')
      ]);
      
      // Tratar resposta paginada do novo backend
      const movData = movRes.data;
      if (movData.data) {
        setMovements(movData.data);
        setTotalPages(movData.pages || 1);
      } else {
        // Fallback caso não venha paginado
        setMovements(Array.isArray(movData) ? movData : []);
        setTotalPages(1);
      }

      setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.data || []));
      setMaterials(Array.isArray(matRes.data) ? matRes.data : (matRes.data.data || []));
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      setLoading(false);
    }
  };

  const getItemInfo = (mov) => {
    if (mov.product_id) {
      const p = products.find(prod => prod.id === mov.product_id);
      return { name: p ? p.name : 'Produto desconhecido', type: 'Produto', id: mov.product_id, category: 'product' };
    } else if (mov.raw_material_id) {
      const m = materials.find(mat => mat.id === mov.raw_material_id);
      return { name: m ? m.name : 'Materia-Prima desconhecida', type: 'Materia-Prima', id: mov.raw_material_id, category: 'material' };
    }
    return { name: 'Item desconhecido', type: 'N/A', id: null, category: null };
  };

  // Filtro local apenas para o termo de busca (melhor performance com paginação)
  const filteredMovements = movements.filter(mov => {
    const info = getItemInfo(mov);
    return info.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleItemClick = (mov) => {
    const info = getItemInfo(mov);
    if (info.id) {
      setSelectedItem(info);
      setCurrentPage(1); // Volta para a primeira página ao filtrar item
      setSearchTerm('');
    }
  };

  const handleBack = () => {
    setSelectedItem(null);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading && movements.length === 0) return <div>Carregando...</div>;

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedItem ? (
              <button className="btn btn-secondary" onClick={handleBack} style={{ padding: '5px', minWidth: 'auto' }}>
                <ArrowLeft size={18} />
              </button>
            ) : (
              <History size={24} />
            )}
            {selectedItem ? `Histórico: ${selectedItem.name}` : 'Movimentações de Estoque'}
          </h2>

          {!selectedItem && (
            <div className="search-box" style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input 
                type="text" 
                placeholder="Buscar por nome..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reseta para pág 1 ao buscar
                }}
                style={{ paddingLeft: '35px', width: '100%' }}
              />
            </div>
          )}
        </div>

        <div className="table-responsive" style={{ marginTop: '20px' }}>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                {!selectedItem && <th>Item</th>}
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map(mov => {
                const info = getItemInfo(mov);
                return (
                  <tr 
                    key={mov.id} 
                    onClick={() => !selectedItem && handleItemClick(mov)}
                    style={{ cursor: !selectedItem ? 'pointer' : 'default' }}
                    className={!selectedItem ? 'row-hover' : ''}
                  >
                    <td>{new Date(mov.date).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${mov.type.includes('entrada') || mov.type.includes('estorno') || mov.type === 'ajuste (+)' ? 'text-success' : 'text-danger'}`}>
                        {mov.type.toUpperCase()}
                      </span>
                    </td>
                    {!selectedItem && (
                      <td style={{ fontWeight: 'bold' }}>
                        <span style={{ color: '#666', fontSize: '0.8rem', display: 'block' }}>{info.type}</span>
                        {info.name}
                      </td>
                    )}
                    <td style={{ color: Number(mov.quantity) > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                      {Number(mov.quantity) > 0 ? `+${mov.quantity}` : mov.quantity}
                    </td>
                  </tr>
                );
              })}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={selectedItem ? "3" : "4"} style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginação */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '20px', padding: '10px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ minWidth: 'auto', padding: '8px' }}
            >
              <ChevronLeft size={20} />
            </button>
            
            <span style={{ fontWeight: 'bold' }}>
              Página {currentPage} de {totalPages}
            </span>

            <button 
              className="btn btn-secondary" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
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

export default StockMovements;
