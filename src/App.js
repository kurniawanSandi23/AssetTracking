import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// ── KONFIGURASI SUPABASE ──────────────────────────────────
const SUPABASE_URL = 'https://gfpzjypnhdxdealwzjzl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmcHpqeXBuaGR4ZGVhbHd6anpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDQxNzQsImV4cCI6MjA5MDE4MDE3NH0.-3ZVVQaeN0TbuGmfmBfqUt35UQuj0vc53YAHgbygi00';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function App() {
  const [laptops, setLaptops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk Form Tambah Unit
  const [newTipe, setNewTipe] = useState('I7');
  const [newTagging, setNewTagging] = useState('');
  const [newIsLlf, setNewIsLlf] = useState(false);

  // Fungsi Ambil Data
  const fetchLaptops = useCallback(async () => {
    try {
      setError(null);
      const { data, error: err } = await supabase
        .from('laptops')
        .select('*')
        .order('no_tagging', { ascending: true });
      
      if (err) throw err;
      setLaptops(data || []);
      setFiltered(data || []);
    } catch (e) {
      setError(e.message || 'Gagal mengambil data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time Subscription
  useEffect(() => {
    fetchLaptops();
    const channel = supabase
      .channel('laptops-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'laptops' }, fetchLaptops)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchLaptops]);

  // Filter Search
  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(q ? laptops.filter(l => l.no_tagging?.toLowerCase().includes(q)) : laptops);
  }, [search, laptops]);

  // Handler Tambah Laptop
  const handleAddLaptop = async (e) => {
    e.preventDefault();
    if (!newTagging) return alert("Harap isi No. Tagging!");

    try {
      const { error } = await supabase
        .from('laptops')
        .insert([{ 
          tipe: newTipe, 
          no_tagging: newTagging.toUpperCase(), 
          is_llf: newIsLlf,
          is_baru: true 
        }]);

      if (error) throw error;
      setNewTagging('');
      setNewIsLlf(false);
    } catch (err) {
      alert("Gagal menambah data: " + err.message);
    }
  };

  // Handler Hapus Laptop
  const handleDeleteLaptop = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus unit ini?")) {
      try {
        const { error } = await supabase.from('laptops').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        alert("Gagal menghapus: " + err.message);
      }
    }
  };

  return (
    <div className="app-container">
      {/* HEADER SECTION (CENTERED) */}
      <header className="header">
        <div className="header-content">
          <h1 className="main-title">Laptop Project FO BO</h1>
          <div className="badge-container">
            <span className="sub-title">Inventory Tracker</span>
            <span className="live-badge">● LIVE</span>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="main-content">
        
        {/* SECTION: TAMBAH UNIT */}
        <div className="admin-actions">
          <h3>➕ Tambah Unit Baru</h3>
          <div className="form-row">
            <select value={newTipe} onChange={(e) => setNewTipe(e.target.value)}>
              <option value="I7">I7</option>
              <option value="I5">I5</option>
            </select>
            
            <input 
              type="text" 
              placeholder="No. Tagging (e.g. CE2508)" 
              value={newTagging}
              onChange={(e) => setNewTagging(e.target.value)}
            />
            
            <label className="checkbox-group">
              <input 
                type="checkbox" 
                checked={newIsLlf} 
                onChange={(e) => setNewIsLlf(e.target.checked)} 
              /> Sudah LLF
            </label>
            
            <button onClick={handleAddLaptop} className="btn-add">Tambah</button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="summary-grid">
          <div className="card">
            <div className="icon-box blue">💻</div>
            <h2>{laptops.length}</h2>
            <span>TOTAL UNIT</span>
          </div>
          <div className="card">
            <div className="icon-box green">✅</div>
            <h2 className="text-success">{laptops.filter(l => l.is_llf).length}</h2>
            <span>SUDAH LLF</span>
          </div>
          <div className="card">
            <div className="icon-box red">❌</div>
            <h2 className="text-danger">{laptops.filter(l => !l.is_llf).length}</h2>
            <span>BELUM LLF</span>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="search-container">
          <span className="search-icon">🔎</span>
          <input 
            type="text" 
            placeholder="Cari No. Tagging..." 
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
          />
        </div>

        {/* TABLE LIST */}
        <div className="table-responsive">
          <table className="laptop-table">
            <thead>
              <tr>
                <th>TIPE</th>
                <th>NO. TAGGING</th>
                <th>STATUS LLF</th>
                <th style={{textAlign: 'center'}}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="center">Memuat data...</td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className={!item.is_llf ? 'row-pending' : ''}>
                    <td>
                      <span className={`badge ${item.tipe?.toLowerCase()}`}>
                        {item.tipe?.toUpperCase()}
                      </span>
                    </td>
                    <td className="tagging-cell">
                      {item.no_tagging}
                      {item.is_baru && <span className="baru-pill">BARU</span>}
                    </td>
                    <td>
                      <div className={`status-pill ${item.is_llf ? 'success' : 'danger'}`}>
                        <span className="dot"></span>
                        {item.is_llf ? 'Sudah LLF' : 'Blm LLF'}
                      </div>
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <button onClick={() => handleDeleteLaptop(item.id)} className="btn-delete">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="center">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER SECTION */}
      <footer className="footer">
        <p>Website Tracking by <strong>@kurniawan sandi</strong></p>
        <p>Email: <a href="mailto:Kurniawan.sandi.tik22@mhsw.pnj.ac.id">Kurniawan.sandi.tik22@mhsw.pnj.ac.id</a></p>
        <p>Contact: <a href="https://wa.me/6289518573420" target="_blank" rel="noreferrer">+62 895-1857-3420</a></p>
      </footer>
    </div>
  );
}

export default App;