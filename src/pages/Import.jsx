import React, { useState } from 'react';
import api from '../services/api';
import { getCategories } from '../services/categories';

const Import = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/api/import/upload', formData);
            // Переносим suggested_category_id в category_id (предзаполняем)
            const transactions = response.data.transactions.map(tx => ({
                ...tx,
                category_id: tx.suggested_category_id || null
            }));
            setPreview(transactions);
            const cats = await getCategories();
            setCategories(cats);
        } catch (err) {
            console.error(err);
            alert('Ошибка при разборе файла');
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (index, categoryId) => {
        const updated = [...preview];
        updated[index].category_id = categoryId;
        setPreview(updated);
    };

    const handleConfirm = async () => {
        const toImport = preview.filter(tx => tx.category_id);
        if (toImport.length === 0) {
            alert('Нет транзакций для импорта');
            return;
        }
        try {
            await api.post('/api/import/confirm', toImport);
            alert(`Импортировано ${toImport.length} транзакций`);
            setPreview(null);
            setFile(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name.trim()) return;
        try {
            await api.post('/api/categories', {
                name: newCategory.name,
                category_type: newCategory.type
            });
            // Обновляем список категорий (новая появится в выпадающих списках)
            const updatedCats = await getCategories();
            setCategories(updatedCats);
            // Не назначаем новую категорию автоматически ни на какие транзакции
            setShowNewCategoryForm(false);
            setNewCategory({ name: '', type: 'expense' });
        } catch (err) {
            console.error(err);
            alert('Ошибка создания категории');
        }
    };

    return (
        <div>
            <h2>Импорт выписки из банка</h2>
            <input type="file" accept=".pdf" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={!file || loading}>
                Загрузить и разобрать
            </button>

            {preview && (
                <div>
                    <h3>Предпросмотр транзакций</h3>
                    <button onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}>
                        + Создать новую категорию
                    </button>

                    {showNewCategoryForm && (
                        <div style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
                            <input
                                type="text"
                                placeholder="Название категории"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            />
                            <select
                                value={newCategory.type}
                                onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                            >
                                <option value="expense">Расход</option>
                                <option value="income">Доход</option>
                            </select>
                            <button onClick={handleCreateCategory}>Создать</button>
                            <button onClick={() => setShowNewCategoryForm(false)}>Отмена</button>
                        </div>
                    )}

                    <table border="1">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Сумма</th>
                                <th>Описание</th>
                                <th>Категория</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preview.map((tx, idx) => (
                                <tr key={idx}>
                                    <td>{tx.date}</td>
                                    <td>{tx.amount} ₽</td>
                                    <td>{tx.description}</td>
                                    <td>
                                        <select
                                            value={tx.category_id || ''}
                                            onChange={(e) => handleCategoryChange(idx, parseInt(e.target.value))}
                                        >
                                            <option value="">— Выберите категорию —</option>
                                            {categories
                                                .filter(cat => cat.category_type === tx.type)
                                                .map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={handleConfirm}>Подтвердить импорт</button>
                </div>
            )}
        </div>
    );
};

export default Import;