import { useState, useEffect } from 'react'
import './App.css'

interface SearchResult {
  path: string;
  name: string;
  size: string;
  mode: string;
}

interface TreeNode {
  name: string;
  path: string;
  children: { [key: string]: TreeNode };
  isFile: boolean;
  data?: SearchResult;
}

// Composant pour l'affichage récursif de l'arbre
const TreeItem = ({ node, onOpen }: { node: TreeNode, onOpen: (path: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = Object.keys(node.children).length > 0;

  return (
    <div style={{ marginLeft: '20px', textAlign: 'left' }}>
      <div 
        onClick={() => hasChildren ? setIsOpen(!isOpen) : node.isFile && onOpen(node.path)}
        style={{ 
          cursor: 'pointer', 
          padding: '4px', 
          display: 'flex', 
          alignItems: 'center',
          gap: '8px',
          backgroundColor: isOpen ? 'var(--header-bg)' : 'transparent',
          borderRadius: '4px',
          margin: '2px 0'
        }}
        className="tree-item-hover"
      >
        <span>{hasChildren ? (isOpen ? '📂' : '📁') : '📄'}</span>
        <span style={{ fontWeight: hasChildren ? 'bold' : 'normal' }}>{node.name}</span>
        {!hasChildren && node.data && (
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({node.data.size} bytes)</span>
        )}
      </div>
      {isOpen && hasChildren && (
        <div style={{ borderLeft: '1px solid var(--border-color)', marginLeft: '10px' }}>
          {Object.values(node.children)
            .sort((a, b) => (a.isFile === b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1))
            .map((child, i) => (
              <TreeItem key={i} node={child} onOpen={onOpen} />
            ))}
        </div>
      )}
    </div>
  );
};

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
  
  // AI Config state
  const [aiConfig, setAiConfig] = useState({
    provider: 'ollama',
    ollama_url: 'http://localhost:11434',
    openrouter_key: '',
    model: 'qwen2.5:3b'
  });
  const [aiModels, setAiModels] = useState<string[]>([]);

  const fetchAiModels = async (provider?: string, url?: string) => {
    try {
      const p = provider || aiConfig.provider;
      const u = url || aiConfig.ollama_url;
      const res = await fetch(`http://localhost:8000/api/ai/models?provider=${p}&ollama_url=${encodeURIComponent(u)}`);
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        setAiModels(data.models);
        // Si le modèle actuel n'est pas dans la liste, on prend le premier
        if (!data.models.includes(aiConfig.model)) {
          setAiConfig(prev => ({ ...prev, model: data.models[0] }));
        }
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des modèles", err);
    }
  };

  useEffect(() => {
    // Load AI config from backend
    fetch('http://localhost:8000/api/ai/config')
      .then(res => res.json())
      .then(data => {
        setAiConfig(data);
        // On récupère les modèles une fois la config chargée
        fetchAiModels(data.provider, data.ollama_url);
      });
  }, []);

  useEffect(() => {
    // Re-fetch models when provider or URL changes
    fetchAiModels();
  }, [aiConfig.provider, aiConfig.ollama_url]);

  const saveAiConfig = async () => {
    const res = await fetch('http://localhost:8000/api/ai/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiConfig)
    });
    const data = await res.json();
    if (data.models) {
      setAiModels(data.models);
    }
    alert(data.message);
  };


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

  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const generateRegexWithAI = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/ai/generate-regex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.regex) {
        setRegexAssistant({ type: 'custom', value: data.regex });
      }
    } catch (err) {
      alert("Erreur lors de la génération IA");
    } finally {
      setAiLoading(false);
    }
  };

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

  const [favorites, setFavorites] = useState<{name: string, params: any}[]>([]);
  const [importCmd, setImportCmd] = useState('');

  // Charger les favoris au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('findor_favorites');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const saveFavorite = () => {
    const name = prompt("Nom du favori :");
    if (!name) return;
    const newFavs = [...favorites, { name, params }];
    setFavorites(newFavs);
    localStorage.setItem('findor_favorites', JSON.stringify(newFavs));
  };

  const deleteFavorite = (index: number) => {
    const newFavs = favorites.filter((_, i) => i !== index);
    setFavorites(newFavs);
    localStorage.setItem('findor_favorites', JSON.stringify(newFavs));
  };

  const loadFavorite = (favParams: any) => {
    setParams(favParams);
    setActiveTab('filters');
  };

  const handleImportCommand = () => {
    if (!importCmd.trim()) return;
    
    const newParams = { ...params };
    const parts = importCmd.split(' ');
    
    // Parser simple pour les arguments classiques
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (i === 1 && !p.startsWith('-')) newParams.directory = p;
      if (p === '-name' || p === '-iname') {
        newParams.name = parts[i+1].replace(/['"]/g, '');
        newParams.case_insensitive = p === '-iname';
        newParams.regex_mode = false;
      }
      if (p === '-type') newParams.type = parts[i+1];
      if (p === '-perm') newParams.perm = parts[i+1];
      if (p === '-user') newParams.user = parts[i+1];
      if (p === '-group') newParams.group = parts[i+1];
      if (p === '-maxdepth') newParams.max_depth = parseInt(parts[i+1]);
      if (p === '-mindepth') newParams.min_depth = parseInt(parts[i+1]);
      if (p === '-size') {
        const s = parts[i+1];
        newParams.size_op = s.startsWith('+') ? '+' : '-';
        newParams.size_val = parseInt(s.slice(1, -1));
        newParams.size_unit = s.slice(-1);
      }
    }
    setParams(newParams);
    setImportCmd('');
    alert('Commande importée avec succès !');
  };

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

  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticExplanations, setSemanticExplanations] = useState<{file: string, relevant: boolean, explanation: string}[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleStopAI = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setSemanticLoading(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!semanticQuery || results.length === 0) return;
    
    const controller = new AbortController();
    setAbortController(controller);
    setSemanticLoading(true);
    setSemanticExplanations([]);

    try {
      const res = await fetch('http://localhost:8000/api/ai/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ 
          query: semanticQuery, 
          files: results.map(r => r.path) 
        })
      });
      const data = await res.json();
      if (data.results) {
        const relevantFiles = data.results.filter((r: any) => r.relevant).map((r: any) => r.file);
        setResults(results.filter(r => relevantFiles.includes(r.path)));
        setSemanticExplanations(data.results);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("Analyse IA annulée par l'utilisateur");
      } else {
        alert("Erreur lors de la recherche sémantique");
      }
    } finally {
      setSemanticLoading(false);
      setAbortController(null);
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
      
      <div className="import-command-zone" style={{ marginBottom: '15px', padding: '15px', backgroundColor: 'var(--header-bg)', borderRadius: '4px', border: '1px solid var(--accent-color)' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>⚡ Importation Rapide (Inverse Search) :</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Collez ici une commande find (ex: find . -name '*.log' -type f)" 
            style={{ flex: 1, fontFamily: 'monospace' }}
            value={importCmd}
            onChange={e => setImportCmd(e.target.value)}
          />
          <button onClick={handleImportCommand} className="primary-btn">Importer</button>
        </div>
      </div>
      
      <div className="cmd-preview">
        {command}
      </div>

      {/* Modal Paramètres */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>⚙️ Paramètres</h2>
            
            <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <h3>🎨 Apparence</h3>
              <button onClick={() => setIsDark(!isDark)}>
                {isDark ? '🌞 Passer au mode Clair' : '🌙 Passer au mode Sombre'}
              </button>
            </section>

            <section style={{ marginBottom: '20px' }}>
              <h3>🤖 Configuration IA</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label>Fournisseur :
                  <select 
                    value={aiConfig.provider} 
                    onChange={e => setAiConfig({...aiConfig, provider: e.target.value})}
                    style={{ marginLeft: '10px' }}
                  >
                    <option value="ollama">Ollama (Local)</option>
                    <option value="openrouter">OpenRouter (Distant)</option>
                  </select>
                </label>

                {aiConfig.provider === 'ollama' ? (
                  <label>URL Ollama :
                    <input 
                      type="text" 
                      value={aiConfig.ollama_url} 
                      onChange={e => setAiConfig({...aiConfig, ollama_url: e.target.value})}
                      style={{ marginLeft: '10px', width: '250px' }}
                    />
                  </label>
                ) : (
                  <label>Clé OpenRouter :
                    <input 
                      type="password" 
                      value={aiConfig.openrouter_key} 
                      onChange={e => setAiConfig({...aiConfig, openrouter_key: e.target.value})}
                      style={{ marginLeft: '10px', width: '250px' }}
                    />
                  </label>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label>Modèle :
                    <select
                      value={aiConfig.model}
                      onChange={e => setAiConfig({...aiConfig, model: e.target.value})}
                      style={{ marginLeft: '10px', minWidth: '200px' }}
                    >
                      {aiModels.length === 0 && <option value="">Chargement des modèles...</option>}
                      {aiModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                  <button 
                    onClick={() => fetchAiModels()} 
                    title="Actualiser la liste des modèles"
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    🔄
                  </button>
                </div>
                <button className="primary-btn" onClick={saveAiConfig}>Enregistrer la config IA</button>
              </div>
            </section>

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
                  <h3 style={{ marginTop: 0 }}>📚 Bibliothèque</h3>
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

                  {favorites.length > 0 && (
                    <>
                      <h3 style={{ marginTop: '20px' }}>⭐ Mes Favoris</h3>
                      {favorites.map((fav, i) => (
                        <div 
                          key={i} 
                          className="scenario-item"
                          style={{ 
                            padding: '10px', 
                            border: '1px solid #f39c12', 
                            marginBottom: '10px', 
                            cursor: 'pointer',
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div onClick={() => loadFavorite(fav.params)} style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold' }}>{fav.name}</div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteFavorite(i); }}
                            style={{ backgroundColor: '#e74c3c', padding: '2px 8px', fontSize: '0.8rem' }}
                          >🗑️</button>
                        </div>
                      ))}
                    </>
                  )}
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
                  <div style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                    <label style={{ fontWeight: 'bold' }}>🤖 Générer avec l'IA : </label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                      <input 
                        type="text" 
                        placeholder="Ex: fichiers contenant une date au format français..." 
                        style={{ flex: 1 }}
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                      />
                      <button 
                        onClick={generateRegexWithAI} 
                        disabled={aiLoading}
                        style={{ backgroundColor: '#009688' }}
                      >
                        {aiLoading ? '⏳...' : 'Générer'}
                      </button>
                    </div>
                  </div>

                  <label>Scénario classique : </label>
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

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={handleSearch} disabled={loading} style={{ flex: 2, padding: '15px' }} className="primary-btn">
          {loading ? 'Recherche en cours...' : '🚀 LANCER LA RECHERCHE'}
        </button>
        <button onClick={saveFavorite} style={{ flex: 1, backgroundColor: '#f39c12' }}>
          ⭐ Enregistrer
        </button>
      </div>

      {error && <div style={{ color: '#ff4444', marginTop: '10px' }}>{error}</div>}

      <div className="semantic-search-bar" style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--explanation-bg)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
        <label style={{ fontWeight: 'bold' }}>🧠 Recherche Sémantique (Filtrer les résultats par contenu) :</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <input 
            type="text" 
            placeholder="Ex: fichiers parlant de configuration réseau..." 
            style={{ flex: 1 }}
            value={semanticQuery}
            onChange={e => setSemanticQuery(e.target.value)}
          />
          {semanticLoading ? (
            <button 
              className="primary-btn" 
              onClick={handleStopAI} 
              style={{ backgroundColor: '#e74c3c' }}
            >
              🛑 STOP
            </button>
          ) : (
            <button 
              className="primary-btn" 
              onClick={handleSemanticSearch} 
              disabled={results.length === 0}
              style={{ backgroundColor: '#673ab7' }}
            >
              🧠 ANALYSER
            </button>
          )}
        </div>
        
        {semanticExplanations.length > 0 && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9', 
            color: isDark ? '#e0e0e0' : '#333',
            borderRadius: '4px', 
            border: '1px solid var(--border-color)', 
            maxHeight: '200px', 
            overflowY: 'auto' 
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>🔍 Détails de l'analyse :</h4>
            {semanticExplanations.map((exp, i) => (
              <div key={i} style={{ 
                marginBottom: '8px', 
                fontSize: '0.85rem', 
                borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`, 
                paddingBottom: '4px' 
              }}>
                <span style={{ 
                  color: exp.relevant ? '#2ecc71' : (isDark ? '#e74c3c' : '#c0392b'), 
                  fontWeight: 'bold' 
                }}>
                  {exp.file.split('/').pop()} :
                </span>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>{exp.explanation}</p>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '5px' }}>
          ℹ️ L'IA analyse les premiers fichiers texte trouvés pour voir s'ils correspondent à votre requête.
        </p>
      </div>

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
