import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categories';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category_type: 'expense',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Ошибка загрузки категорий', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateCategory(editingId, formData.name);
            } else {
                await createCategory(formData.name, formData.category_type);
            }
            resetForm();
            await fetchCategories();
        } catch (error) {
            console.error('Ошибка сохранения категории', error);
            alert('Не удалось сохранить категорию');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', category_type: 'expense' });
        setEditingId(null);
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setFormData({
            name: category.name,
            category_type: category.category_type,
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить категорию? Это действие нельзя отменить.')) return;
        try {
            await deleteCategory(id);
            await fetchCategories();
        } catch (error) {
            console.error('Ошибка удаления', error);
            alert('Не удалось удалить категорию. Возможно, она используется в транзакциях.');
        }
    };

    if (loading) return <div>Загрузка...</div>;

    // Разделяем категории
    const incomeCategories = categories.filter(cat => cat.category_type === 'income');
    const expenseCategories = categories.filter(cat => cat.category_type === 'expense');

    return (
        <div>
            <h2>Управление категориями</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Название категории"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                />
                <select
                    name="category_type"
                    value={formData.category_type}
                    onChange={handleInputChange}
                    disabled={!!editingId}
                >
                    <option value="expense">Расход</option>
                    <option value="income">Доход</option>
                </select>
                <button type="submit">{editingId ? 'Сохранить' : 'Добавить'}</button>
                {editingId && <button type="button" onClick={resetForm}>Отмена</button>}
            </form>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <h3>Доходы</h3>
                    <ul>
                        {incomeCategories.map(cat => (
                            <li key={cat.id}>
                                {cat.name}
                                {cat.user_id !== null && (
                                    <>
                                        <button onClick={() => handleEdit(cat)}>✏️</button>
                                        <button onClick={() => handleDelete(cat.id)}>🗑️</button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ flex: 1 }}>
                    <h3>Расходы</h3>
                    <ul>
                        {expenseCategories.map(cat => (
                            <li key={cat.id}>
                                {cat.name}
                                {cat.user_id !== null && (
                                    <>
                                        <button onClick={() => handleEdit(cat)}>✏️</button>
                                        <button onClick={() => handleDelete(cat.id)}>🗑️</button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Categories;