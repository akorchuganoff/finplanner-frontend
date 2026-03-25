import React, { useState, useEffect } from 'react';
import { getCategories } from '../services/categories';
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} from '../services/transactions';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        amount: '',
        transaction_type: 'expense',
        date: new Date().toISOString().slice(0, 10),
        comment: '',
        category_id: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [categoriesData, transactionsData] = await Promise.all([
                    getCategories(),
                    getTransactions(),
                ]);
                setCategories(categoriesData);
                setTransactions(transactionsData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateTransaction(editingId, formData);
            } else {
                await createTransaction(formData);
            }
            // Обновляем список транзакций
            const updatedTransactions = await getTransactions();
            setTransactions(updatedTransactions);
            resetForm();
        } catch (error) {
            console.error(error);
            alert('Ошибка сохранения транзакции');
        }
    };

    const resetForm = () => {
        setFormData({
            amount: '',
            transaction_type: 'expense',
            date: new Date().toISOString().slice(0, 10),
            comment: '',
            category_id: '',
        });
        setEditingId(null);
    };

    const handleEdit = (transaction) => {
        setEditingId(transaction.id);
        setFormData({
            amount: transaction.amount,
            transaction_type: transaction.transaction_type,
            date: transaction.date,
            comment: transaction.comment || '',
            category_id: transaction.category_id,
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Удалить транзакцию?')) {
            try {
                await deleteTransaction(id);
                const updatedTransactions = await getTransactions();
                setTransactions(updatedTransactions);
            } catch (error) {
                console.error(error);
                alert('Ошибка удаления');
            }
        }
    };

    // Фильтруем категории по выбранному типу транзакции
    const filteredCategories = categories.filter(
        (cat) => cat.category_type === formData.transaction_type
    );

    if (loading) return <div>Загрузка...</div>;

    return (
        <div>
            <h2>Транзакции</h2>

            <form onSubmit={handleSubmit}>
                <select
                    name="transaction_type"
                    value={formData.transaction_type}
                    onChange={handleInputChange}
                >
                    <option value="expense">Расход</option>
                    <option value="income">Доход</option>
                </select>

                <input
                    type="number"
                    name="amount"
                    placeholder="Сумма"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                />

                <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                />

                <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                >
                    <option value="">Выберите категорию</option>
                    {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    name="comment"
                    placeholder="Комментарий"
                    value={formData.comment}
                    onChange={handleInputChange}
                />

                <button type="submit">{editingId ? 'Сохранить' : 'Добавить'}</button>
                {editingId && <button onClick={resetForm}>Отмена</button>}
            </form>

            <h3>Список транзакций</h3>
            <table border="1" cellPadding="5">
                <thead>
                    <tr>
                        <th>Дата</th>
                        <th>Сумма</th>
                        <th>Тип</th>
                        <th>Категория</th>
                        <th>Комментарий</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx) => (
                        <tr key={tx.id}>
                            <td>{tx.date}</td>
                            <td>{tx.amount}</td>
                            <td>{tx.transaction_type === 'income' ? 'Доход' : 'Расход'}</td>
                            <td>{categories.find((c) => c.id === tx.category_id)?.name}</td>
                            <td>{tx.comment}</td>
                            <td>
                                <button onClick={() => handleEdit(tx)}>✏️</button>
                                <button onClick={() => handleDelete(tx.id)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Transactions;