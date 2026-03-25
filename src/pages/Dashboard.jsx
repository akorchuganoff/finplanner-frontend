import React, { useState, useEffect } from 'react';
import { getAggregated, getBalanceTimeline } from '../services/dashboard'; // добавлен getBalanceTimeline
import { useAuth } from '../context/AuthContext';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Legend // добавлены элементы для графика
} from 'recharts';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [months, setMonths] = useState(1);

    // Состояния для графика
    const [timelineData, setTimelineData] = useState([]);
    const [timelineGroupBy, setTimelineGroupBy] = useState('day');
    const [timelineLoading, setTimelineLoading] = useState(false);

    // Загрузка агрегированных данных (для круговых диаграмм)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getAggregated(months);
                setData(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [months]);

    // Загрузка данных для линейного графика
    useEffect(() => {
        const fetchTimeline = async () => {
            setTimelineLoading(true);
            try {
                const result = await getBalanceTimeline(timelineGroupBy);
                setTimelineData(result);
            } catch (error) {
                console.error(error);
            } finally {
                setTimelineLoading(false);
            }
        };
        fetchTimeline();
    }, [timelineGroupBy]);

    if (loading) return <div>Загрузка...</div>;
    if (!data) return <div>Ошибка загрузки данных</div>;

    // Подготовка данных для круговых диаграмм (без изменений)
    const pieDataIncome = (data.period_breakdown?.income || []).map(item => ({
        name: item.category_name,
        value: Number(item.amount)
    }));
    const pieDataExpense = (data.period_breakdown?.expense || []).map(item => ({
        name: item.category_name,
        value: Number(item.amount)
    }));

    // Вычисляем накопленный баланс для графика
    const cumulativeData = timelineData.reduce((acc, curr, index) => {
        const prevBalance = index > 0 ? acc[index - 1].cumulativeBalance : 0;
        acc.push({
            ...curr,
            cumulativeBalance: prevBalance + curr.balance
        });
        return acc;
    }, []);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#F39C12', '#2ECC71'];

    return (
        <div style={{ padding: '20px' }}>
            <h1>Дашборд</h1>
            <p>Добро пожаловать, {user?.email}!</p>
            <button onClick={logout}>Выйти</button>

            {/* Селектор месяцев для круговых диаграмм (был) */}
            <div style={{ marginTop: '20px' }}>
                <label>Период: </label>
                <select value={months} onChange={(e) => setMonths(parseInt(e.target.value))}>
                    <option value={1}>Последний месяц</option>
                    <option value={3}>Последние 3 месяца</option>
                    <option value={6}>Последние 6 месяцев</option>
                    <option value={12}>Последние 12 месяцев</option>
                </select>
            </div>

            {/* Карточки баланса (без изменений) */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', flex: 1 }}>
                    <h3>Общий баланс</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {Number(data.balance).toFixed(2)} ₽
                    </p>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', flex: 1 }}>
                    <h3>Баланс за период</h3>
                    <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {Number(data.period_balance).toFixed(2)} ₽
                    </p>
                    <small>
                        {data.period_start} – {data.period_end}
                    </small>
                </div>
            </div>

            {/* НОВЫЙ БЛОК: График изменения баланса */}
            <div style={{ marginTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Динамика баланса</h2>
                    <select value={timelineGroupBy} onChange={(e) => setTimelineGroupBy(e.target.value)}>
                        <option value="day">По дням</option>
                        <option value="month">По месяцам</option>
                        <option value="quarter">По кварталам</option>
                    </select>
                </div>
                {timelineLoading ? (
                    <p>Загрузка графика...</p>
                ) : cumulativeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={cumulativeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" tickFormatter={(tick) => new Date(tick).toLocaleDateString()} />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value.toFixed(2)} ₽`} />
                            <Legend />
                            <Line type="monotone" dataKey="cumulativeBalance" name="Накопленный баланс" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p>Нет данных для построения графика</p>
                )}
            </div>

            {/* Круговые диаграммы (без изменений) */}
            <div style={{ marginTop: '40px' }}>
                <h2>Структура доходов за период</h2>
                {pieDataIncome.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieDataIncome}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieDataIncome.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p>Нет данных о доходах за выбранный период</p>
                )}
            </div>

            <div style={{ marginTop: '40px' }}>
                <h2>Структура расходов за период</h2>
                {pieDataExpense.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieDataExpense}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieDataExpense.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p>Нет данных о расходах за выбранный период</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;