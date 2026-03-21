import { useState, useEffect } from 'react';
import { categoriesAPI, subCategoriesAPI } from '../api';
import useIsMobile from '../useIsMobile';

export default function CategoriesPage() {
  const isMobile = useIsMobile();
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubIsFixed, setNewSubIsFixed] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [subCategories, setSubCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCatId) fetchSubCategories(selectedCatId);
  }, [selectedCatId]);

  const fetchCategories = async () => {
    const res = await categoriesAPI.getAll();
    setCategories(res.data);
  };

  const fetchSubCategories = async (categoryId) => {
    const res = await subCategoriesAPI.getAll(categoryId);
    setSubCategories(res.data);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    await categoriesAPI.create({ name: newCatName.trim() });
    setNewCatName('');
    fetchCategories();
  };

  const handleDeleteCategory = async (id) => {
    await categoriesAPI.delete(id);
    if (selectedCatId === id) {
      setSelectedCatId(null);
      setSubCategories([]);
    }
    fetchCategories();
  };

  const handleAddSubCategory = async () => {
    if (!newSubName.trim() || !selectedCatId) return;
    await subCategoriesAPI.create({
      name: newSubName.trim(),
      categoryId: selectedCatId,
      isFixed: newSubIsFixed
    });
    setNewSubName('');
    fetchSubCategories(selectedCatId);
  };

  const handleDeleteSubCategory = async (id) => {
    await subCategoriesAPI.delete(id);
    fetchSubCategories(selectedCatId);
  };

  const cardStyle = {
    background: 'white',
    borderRadius: 12,
    padding: isMobile ? 14 : 20,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  };

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1.5px solid #e2e8f0',
    fontSize: 14,
    outline: 'none',
    flex: 1,
    minWidth: 0,
  };

  const btnStyle = (color = '#3b82f6') => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: color,
    color: 'white',
    flexShrink: 0,
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16 }}>

      {/* Left — Categories */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Categories</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            style={inputStyle}
            placeholder="New category name"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
          />
          <button style={btnStyle()} onClick={handleAddCategory}>Add</button>
        </div>

        {categories.map(cat => (
          <div key={cat._id} onClick={() => setSelectedCatId(cat._id)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
              background: selectedCatId === cat._id ? '#eff6ff' : '#f8fafc',
              border: selectedCatId === cat._id ? '1.5px solid #3b82f6' : '1.5px solid transparent'
            }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</span>
            <button onClick={e => { e.stopPropagation(); handleDeleteCategory(cat._id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}>
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Right — Sub Categories */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          {selectedCatId
            ? `Sub-categories — ${categories.find(c => c._id === selectedCatId)?.name}`
            : 'Select a category'}
        </h2>

        {selectedCatId && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                style={inputStyle}
                placeholder="New sub-category"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubCategory()}
              />
              <button style={btnStyle()} onClick={handleAddSubCategory}>Add</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <input type="checkbox" id="isFixed" checked={newSubIsFixed}
                onChange={e => setNewSubIsFixed(e.target.checked)} />
              <label htmlFor="isFixed" style={{ fontSize: 13, color: '#475569' }}>
                Fixed every month
              </label>
            </div>

            {subCategories.map(sub => (
              <div key={sub._id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: '#f8fafc',
                  gap: 8,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{sub.name}</span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: sub.isFixed ? '#dcfce7' : '#fef9c3',
                    color: sub.isFixed ? '#16a34a' : '#ca8a04',
                    whiteSpace: 'nowrap',
                  }}>
                    {sub.isFixed ? 'Fixed' : 'Flexible'}
                  </span>
                </div>
                <button onClick={() => handleDeleteSubCategory(sub._id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, flexShrink: 0 }}>
                  ✕
                </button>
              </div>
            ))}
          </>
        )}
      </div>

    </div>
  );
}
