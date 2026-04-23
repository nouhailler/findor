import { useState, useEffect } from 'react'
import './App.css'

interface SearchResult {
  path: str;
  name: str;
  size: str;
  mode: str;
}

function App() {
  const [activeTab, setActiveTab] = useState('filters');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [command, setCommand] = useState('find .');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [params, setParams] = useState({
    directory: '',
    name: '',
    case_insensitive: true,
    type: 'Tout',
    size_op: '+',
    size_val: 0,
    size_unit: 'k',
    mtime: -1,
    min_depth: 0,
    max_depth: 0,
    perm: '',
    user: '',
    group: '',
    exec_cmd: ''
  });

  useEffect(() => {
    // Get initial CWD from backend
    fetch('http://localhost:8000/api/cwd')
      .then(res => res.json())
      .then(data => setParams(prev => ({ ...prev, directory: data.cwd })))
      .catch(() => setParams(prev => ({ ...prev, directory: '.' })));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur lors de la recherche');
      }
      const data = await response.json();
      setResults(data.results);
      setCommand(data.command);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app-container">
      <h1>Findor Pro Web 🔍</h1>
      
      <div className="cmd-preview">
        {command}
      </div>

      <div className="tab-container">
        <div className="tab-header">
          <button 
            className={`tab-btn ${activeTab === 'filters' ? 'active' : ''}`}
            onClick={() => setActiveTab('filters')}
          >🔍 Filtres</button>
          <button 
            className={`tab-btn ${activeTab === 'perms' ? 'active' : ''}`}
            onClick={() => setActiveTab('perms')}
          >🔑 Permissions</button>
          <button 
            className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >⚙️ Actions</button>
        </div>

        <div className="tab-content" style={{ padding: '20px' }}>
          {activeTab === 'filters' && (
            <div className="grid-filters">
              <div className="input-group">
                <label>Dossier : </label>
                <input 
                  type="text" 
                  value={params.directory} 
                  onChange={e => updateParam('directory', e.target.value)} 
                  style={{ width: '80%' }}
                />
              </div>
              <div className="input-group" style={{ marginTop: '10px' }}>
                <label>Nom : </label>
                <input 
                  type="text" 
                  placeholder="*.py" 
                  value={params.name} 
                  onChange={e => updateParam('name', e.target.value)} 
                />
                <label style={{ marginLeft: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={params.case_insensitive} 
                    onChange={e => updateParam('case_insensitive', e.target.checked)} 
                  /> Ignorer la casse
                </label>
              </div>
              <div className="input-group" style={{ marginTop: '10px' }}>
                <label>Type : </label>
                <select value={params.type} onChange={e => updateParam('type', e.target.value)}>
                  <option>Tout</option>
                  <option>Fichiers (f)</option>
                  <option>Dossiers (d)</option>
                  <option>Liens (l)</option>
                </select>

                <label style={{ marginLeft: '20px' }}>Taille : </label>
                <select value={params.size_op} onChange={e => updateParam('size_op', e.target.value)}>
                  <option>+</option>
                  <option>-</option>
                </select>
                <input 
                  type="number" 
                  value={params.size_val} 
                  onChange={e => updateParam('size_val', parseInt(e.target.value) || 0)} 
                  style={{ width: '60px' }}
                />
                <select value={params.size_unit} onChange={e => updateParam('size_unit', e.target.value)}>
                  <option>k</option>
                  <option>M</option>
                  <option>G</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'perms' && (
            <div className="grid-perms">
              <label>Permissions : </label>
              <input type="text" placeholder="755" value={params.perm} onChange={e => updateParam('perm', e.target.value)} />
              <label style={{ marginLeft: '10px' }}>User : </label>
              <input type="text" value={params.user} onChange={e => updateParam('user', e.target.value)} />
              <label style={{ marginLeft: '10px' }}>Group : </label>
              <input type="text" value={params.group} onChange={e => updateParam('group', e.target.value)} />
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="grid-actions">
              <label>Action (-exec) : </label>
              <input 
                type="text" 
                placeholder="chmod 644" 
                value={params.exec_cmd} 
                onChange={e => updateParam('exec_cmd', e.target.value)} 
                style={{ width: '100%' }}
              />
              <p style={{ color: '#888', fontSize: '0.8rem' }}>Note: {} \; est ajouté automatiquement.</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleSearch} disabled={loading} style={{ width: '100%', padding: '15px' }}>
          {loading ? 'Recherche en cours...' : '🚀 LANCER LA RECHERCHE'}
        </button>
      </div>

      {error && <div style={{ color: '#ff4444', marginTop: '10px' }}>{error}</div>}

      <div className="results-container">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Chemin</th>
              <th>Taille</th>
              <th>Mode</th>
            </tr>
          </thead>
          <tbody>
            {results.map((res, i) => (
              <tr key={i}>
                <td>{res.name}</td>
                <td style={{ fontSize: '0.8rem', color: '#aaa' }}>{res.path}</td>
                <td>{res.size}</td>
                <td>{res.mode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
