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

  // Fungsi Ambil Data (Sama dengan logika kode lamamu)
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

  // Real-time Subscription (Sama dengan kode lamamu)
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

  return (
    <div className="app-container">
      {/* HEADER SECTION */}
      <header className="header">
        <div className="header-content">
          <h1>Laptop Di PT Nexwave</h1>
          <p>Inventory Tracker <span className="live-badge">● LIVE</span></p>
        </div>
      </header>

      {/* ERROR BANNER */}
      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="main-content">
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
            placeholder="Cari No. Tagging (Contoh: CE2508)..." 
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
                <th style={{textAlign: 'right'}}>STATUS LLF</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="center">Memuat data...</td></tr>
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
                    <td style={{textAlign: 'right'}}>
                      <div className={`status-pill ${item.is_llf ? 'success' : 'danger'}`}>
                        <span className="dot"></span>
                        {item.is_llf ? 'Sudah LLF' : 'Blm LLF'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" className="center">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;