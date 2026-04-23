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

  // Modals state
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Form states
  const [params, setParams] = useState({
    directory: '',
    name: '',
    case_insensitive: true,
    regex_mode: false,
    regex_pattern: '',
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
    exec_cmd: '',
    exec_plus: false,
    prune_dirs: '',
    newer_file: '',
    empty_only: false,
    inode: 0,
    same_file: ''
  });

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const scenarios = [
    {
      id: 'prune',
      title: 'Ignorer des répertoires (Pruning)',
      description: 'Évite de descendre dans node_modules ou .git pour booster les performances.',
      explanation: 'Le flag -prune indique à find de ne pas explorer le contenu du dossier correspondant. L\'opérateur -o (OR) permet ensuite de continuer la recherche sur le reste.',
      apply: () => setParams(prev => ({ ...prev, prune_dirs: 'node_modules, .git', name: '*.js' }))
    },
    {
      id: 'newer',
      title: 'Empreinte temporelle relative',
      description: 'Trouve les fichiers modifiés après un fichier témoin.',
      explanation: 'L\'option -newer compare la date de modification des fichiers avec celle du fichier spécifié.',
      apply: () => setParams(prev => ({ ...prev, newer_file: 'package.json' }))
    },
    {
      id: 'plus',
      title: 'Optimisation Exec (+ vs ;)',
      description: 'Utiliser + pour regrouper les fichiers et gagner du temps.',
      explanation: 'Avec +, find lance la commande une seule fois avec tous les fichiers en arguments (comme xargs), alors qu\'avec ; il lance une instance par fichier.',
      apply: () => setParams(prev => ({ ...prev, exec_cmd: 'ls -l', exec_plus: true }))
    },
    {
      id: 'empty',
      title: 'Fichiers vides',
      description: 'Cible les fichiers ou dossiers de 0 octet.',
      explanation: 'L\'option -empty est idéale pour faire du ménage dans les logs ou les dossiers temporaires.',
      apply: () => setParams(prev => ({ ...prev, empty_only: true, type: 'Fichiers (f)' }))
    },
    {
      id: 'perm_open',
      title: 'Permissions trop ouvertes',
      description: 'Trouver les fichiers accessibles en écriture par tous.',
      explanation: 'Le prefixe / dans -perm /002 signifie "au moins l\'un de ces bits". Ici, on cherche l\'écriture pour "others".',
      apply: () => setParams(prev => ({ ...prev, perm: '/002' }))
    }
  ];

  const [regexAssistant, setRegexAssistant] = useState({
    type: 'none',
    value: ''
  });

  useEffect(() => {
    document.documentElement.className = isDark ? '' : 'light-theme';
  }, [isDark]);

  useEffect(() => {
    if (params.regex_mode) {
      let pattern = '';
      switch (regexAssistant.type) {
        case 'starts': pattern = `.*/${regexAssistant.value}.*`; break;
        case 'ends': pattern = `.*${regexAssistant.value}$`; break;
        case 'digits': pattern = `.*/[0-9]+[^/]*$`; break;
        case 'date': pattern = `.*/[0-9]{4}-[0-9]{2}-[0-9]{2}[^/]*$`; break;
        case 'or': 
          const words = regexAssistant.value.split(',').map(w => w.trim()).filter(w => w);
          pattern = `.*/(${words.join('|')})[^/]*$`; 
          break;
        case 'custom': pattern = regexAssistant.value; break;
        default: pattern = `.*${regexAssistant.value}.*`;
      }
      updateParam('regex_pattern', pattern);
    }
  }, [regexAssistant, params.regex_mode]);

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

  const handleOpenFile = async (path: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/open-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      if (!response.ok) throw new Error('Erreur lors de l\'ouverture');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="app-container">
      <div className="top-bar">
        <button onClick={() => setShowSettings(true)}>⚙️ Paramètres</button>
        <button onClick={() => setShowHelp(true)}>❓ Aide</button>
      </div>

      <h1>Findor Pro Web 🔍</h1>
      
      <div className="cmd-preview">
        {command}
      </div>

      {/* Modal Paramètres */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>⚙️ Paramètres</h2>
            <div style={{ margin: '20px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                Thème : 
                <button onClick={() => setIsDark(!isDark)}>
                  {isDark ? '🌞 Passer au mode Clair' : '🌙 Passer au mode Sombre'}
                </button>
              </label>
            </div>
            <button onClick={() => setShowSettings(false)}>Fermer</button>
          </div>
        </div>
      )}

      {/* Modal Aide */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>❓ Aide - Comment utiliser Findor Pro</h2>
            <div style={{ lineHeight: '1.6' }}>
              <h3>🔍 Onglet Filtres</h3>
              <p>Le point de départ de votre recherche. Utilisez le mode <strong>Standard</strong> pour les wildcards classiques ou l'<strong>Assistant Regex</strong> pour des motifs complexes.</p>

              <h3>🔑 Permissions & Propriété</h3>
              <p>Ciblez des fichiers par leur mode octal (ex: 755) ou leur propriétaire système.</p>

              <h3>⚙️ Actions</h3>
              <p>Exécutez des commandes système via <code>-exec</code>. Choisissez le terminateur <code>+</code> pour une performance maximale sur de grands volumes de fichiers.</p>

              <h3>💡 Scénarios</h3>
              <p>Explorez les recettes prédéfinies pour apprendre les techniques avancées comme le <strong>Pruning</strong> (ignorer des dossiers volumineux).</p>

              <div style={{ backgroundColor: 'rgba(26, 115, 232, 0.1)', padding: '15px', borderRadius: '4px', border: '1px solid #1a73e8', marginTop: '15px' }}>
                <strong>Astuce :</strong> Cliquez sur une ligne de résultat pour ouvrir le fichier dans l'éditeur de texte système.
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setShowHelp(false)}>Fermer l'aide</button>
            </div>
          </div>
        </div>
      )}

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
          <button 
            className={`tab-btn ${activeTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('scenarios')}
          >💡 Scénarios</button>
        </div>

        <div className="tab-content" style={{ padding: '20px' }}>
          {activeTab === 'scenarios' && (
            <div className="scenarios-grid">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="scenario-list">
                  {scenarios.map(s => (
                    <div 
                      key={s.id} 
                      className={`scenario-item ${selectedScenario === s.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedScenario(s.id);
                        s.apply();
                      }}
                      style={{ 
                        padding: '10px', 
                        border: '1px solid var(--border-color)', 
                        marginBottom: '10px', 
                        cursor: 'pointer',
                        backgroundColor: selectedScenario === s.id ? 'var(--accent-color)' : 'var(--card-bg)',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{s.title}</div>
                      <div style={{ fontSize: '0.85rem', color: selectedScenario === s.id ? 'white' : 'var(--text-color)', opacity: 0.8 }}>{s.description}</div>
                    </div>
                  ))}
                </div>
                <div className="scenario-explanation" style={{ padding: '20px', backgroundColor: 'var(--explanation-bg)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  {selectedScenario ? (
                    <>
                      <h3 style={{ marginTop: 0, color: 'var(--accent-color)' }}>Comment ça marche ?</h3>
                      <p>{scenarios.find(s => s.id === selectedScenario)?.explanation}</p>
                      <div style={{ padding: '10px', backgroundColor: 'var(--cmd-bg)', border: '1px solid var(--cmd-text)', color: 'var(--cmd-text)', fontFamily: 'monospace' }}>
                        💡 Les filtres ont été ajustés automatiquement.
                      </div>
                    </>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#666' }}>Sélectionnez un scénario à gauche pour voir les explications et appliquer les filtres.</p>
                  )}
                </div>
              </div>
            </div>
          )}
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

              <div className="mode-selector" style={{ margin: '15px 0', padding: '10px', backgroundColor: 'var(--header-bg)', borderRadius: '4px' }}>
                <label style={{ fontWeight: 'bold' }}>Mode de recherche : </label>
                <select 
                  value={params.regex_mode ? 'regex' : 'standard'} 
                  onChange={e => updateParam('regex_mode', e.target.value === 'regex')}
                >
                  <option value="standard">Standard (Wildcards *.txt)</option>
                  <option value="regex">Assistant Regex (Avancé)</option>
                </select>
              </div>

              {!params.regex_mode ? (
                <div className="input-group">
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
              ) : (
                <div className="regex-assistant" style={{ border: '1px solid var(--border-color)', padding: '10px', backgroundColor: 'var(--explanation-bg)' }}>
                  <label>Scénario : </label>
                  <select 
                    value={regexAssistant.type} 
                    onChange={e => setRegexAssistant({...regexAssistant, type: e.target.value})}
                  >
                    <option value="none">Contient le texte...</option>
                    <option value="starts">Commence par...</option>
                    <option value="ends">Se termine par...</option>
                    <option value="digits">Uniquement des chiffres</option>
                    <option value="date">Format date (AAAA-MM-JJ)</option>
                    <option value="or">L'un de ces mots (séparés par virgule)</option>
                    <option value="custom">Regex personnalisée</option>
                  </select>
                  
                  {regexAssistant.type !== 'digits' && regexAssistant.type !== 'date' && (
                    <input 
                      type="text" 
                      placeholder="Valeur..." 
                      style={{ marginLeft: '10px', width: '200px' }}
                      value={regexAssistant.value}
                      onChange={e => setRegexAssistant({...regexAssistant, value: e.target.value})}
                    />
                  )}
                  
                  <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--cmd-text)' }}>
                    Regex générée : <code>{params.regex_pattern}</code>
                  </div>
                </div>
              )}

              <div className="expert-filters" style={{ marginTop: '15px', padding: '10px', borderTop: '1px dotted #444' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div className="input-group">
                    <label>Ignorer (Prune) : </label>
                    <input 
                      type="text" 
                      placeholder="node_modules, .git" 
                      value={params.prune_dirs} 
                      onChange={e => updateParam('prune_dirs', e.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label>Plus récent que (Newer) : </label>
                    <input 
                      type="text" 
                      placeholder="chemin/du/fichier" 
                      value={params.newer_file} 
                      onChange={e => updateParam('newer_file', e.target.value)} 
                    />
                  </div>
                  <div className="input-group">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={params.empty_only} 
                        onChange={e => updateParam('empty_only', e.target.checked)} 
                      /> Uniquement vides (-empty)
                    </label>
                  </div>
                </div>
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
                placeholder="chmod 644, rm -rf, grep 'test'" 
                value={params.exec_cmd} 
                onChange={e => updateParam('exec_cmd', e.target.value)} 
                style={{ width: '100%' }}
              />
              <div style={{ marginTop: '10px' }}>
                <label>Terminateur : </label>
                <select value={params.exec_plus ? '+' : ';'} onChange={e => updateParam('exec_plus', e.target.value === '+')}>
                  <option value=";">Point-virgule (;) - Une instance par fichier (Plus lent)</option>
                  <option value="+">Plus (+) - Tous les fichiers en arguments (Plus rapide)</option>
                </select>
              </div>
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '10px' }}>ℹ️ L'application ajoutera automatiquement le terminateur à la fin.</p>
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
              <tr 
                key={i} 
                onClick={() => handleOpenFile(res.path)} 
                title="Cliquer pour ouvrir dans l'éditeur"
                style={{ cursor: 'pointer' }}
              >
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
