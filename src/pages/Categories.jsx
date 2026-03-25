import React, { useState, useEffect } from 'react';
import * as categoriesService from '../services/categories';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editCategory, setEditCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', type: 'expense' });

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await categoriesService.getCategories();
            setCategories(data);
        } catch (err) {
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editCategory) {
                await categoriesService.updateCategory(editCategory.id, formData.name);
            } else {
                await categoriesService.createCategory(formData.name, formData.type);
            }
            resetForm();
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditCategory(null);
        setFormData({ name: '', type: 'expense' });
        setError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            await categoriesService.deleteCategory(id);
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.detail || 'Delete failed');
        }
    };

    const handleEdit = (cat) => {
        setEditCategory(cat);
        setFormData({ name: cat.name, type: cat.type });
        setShowForm(true);
    };

    // Группируем категории по типу
    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2>Manage Categories</h2>
            <button onClick={() => { setShowForm(true); setEditCategory(null); setFormData({ name: '', type: 'expense' }); }}>Add Category</button>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {showForm && (
                <form onSubmit={handleSubmit}>
                    <h3>{editCategory ? 'Edit Category' : 'New Category'}</h3>
                    <div>
                        <label>Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label>Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            disabled={!!editCategory} // при редактировании тип менять нельзя (можно, но проще не усложнять)
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>
                    <button type="submit">Save</button>
                    <button type="button" onClick={resetForm}>Cancel</button>
                </form>
            )}

            <div>
                <h3>Income Categories</h3>
                <ul>
                    {incomeCategories.map(cat => (
                        <li key={cat.id}>
                            {cat.name}
                            {cat.user_id !== null && ( // только пользовательские можно редактировать/удалять
                                <>
                                    <button onClick={() => handleEdit(cat)}>Edit</button>
                                    <button onClick={() => handleDelete(cat.id)}>Delete</button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h3>Expense Categories</h3>
                <ul>
                    {expenseCategories.map(cat => (
                        <li key={cat.id}>
                            {cat.name}
                            {cat.user_id !== null && (
                                <>
                                    <button onClick={() => handleEdit(cat)}>Edit</button>
                                    <button onClick={() => handleDelete(cat.id)}>Delete</button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Categories;