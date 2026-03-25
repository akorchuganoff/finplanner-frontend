import React, { useState, useEffect } from 'react';
import { getCashFlowSummary } from '../services/dashboard';

const CashFlow = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Фильтры (без категорий)
    const [groupBy, setGroupBy] = useState('day'); // 'day', 'month', 'quarter'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Для раскрытия категорий
    const [expandedPeriods, setExpandedPeriods] = useState({});

    // Загрузка данных отчёта
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                group_by: groupBy,
            };
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            // Параметр category_ids больше не передаём
            const data = await getCashFlowSummary(params);
            setSummaryData(data);
        } catch (err) {
            console.error(err);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    // Загружаем при изменении фильтров
    useEffect(() => {
        fetchData();
    }, [groupBy, startDate, endDate]);

    // Переключение раскрытия категорий для периода
    const togglePeriod = (periodKey) => {
        setExpandedPeriods(prev => ({
            ...prev,
            [periodKey]: !prev[periodKey]
        }));
    };

    // Форматирование суммы
    const formatAmount = (amount) => {
        if (amount === undefined || amount === null) return '0.00 ₽';
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(num)) return '0.00 ₽';
        return `${num.toFixed(2)} ₽`;
    };

    // Стили (можно вынести в CSS, но для простоты оставим в компоненте)
    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px'
    };
    const thStyle = {
        border: '1px solid #ddd',
        padding: '8px',
        backgroundColor: '#f2f2f2',
        textAlign: 'left'
    };
    const tdStyle = {
        border: '1px solid #ddd',
        padding: '8px'
    };
    const subTableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px',
        marginBottom: '10px'
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Отчёт о движении денежных средств</h2>

            {/* Фильтры */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div>
                    <label>Группировка: </label>
                    <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                        <option value="day">По дням</option>
                        <option value="month">По месяцам</option>
                        <option value="quarter">По кварталам</option>
                    </select>
                </div>

                <div>
                    <label>Начало: </label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                <div>
                    <label>Конец: </label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
            </div>

            {loading && <p>Загрузка...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {!loading && !error && (
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Период</th>
                            <th style={thStyle}>Доходы</th>
                            <th style={thStyle}>Расходы</th>
                            <th style={thStyle}>Чистый поток</th>
                            <th style={thStyle}>Детали</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.map((period) => (
                            <React.Fragment key={period.period}>
                                <tr>
                                    <td style={tdStyle}>{period.period}</td>
                                    <td style={{ ...tdStyle, color: 'green' }}>{formatAmount(period.income)}</td>
                                    <td style={{ ...tdStyle, color: 'red' }}>{formatAmount(period.expense)}</td>
                                    <td style={{ ...tdStyle, color: period.net >= 0 ? 'green' : 'red' }}>
                                        {period.net >= 0 ? '+' : ''}{formatAmount(period.net)}
                                    </td>
                                    <td style={tdStyle}>
                                        <button onClick={() => togglePeriod(period.period)}>
                                            {expandedPeriods[period.period] ? 'Скрыть категории' : 'Показать категории'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedPeriods[period.period] && period.categories && period.categories.length > 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '0', background: '#f9f9f9' }}>
                                            <div style={{ padding: '10px', marginLeft: '20px' }}>
                                                <table style={subTableStyle}>
                                                    <thead>
                                                        <tr>
                                                            <th style={thStyle}>Категория</th>
                                                            <th style={thStyle}>Доходы</th>
                                                            <th style={thStyle}>Расходы</th>
                                                            <th style={thStyle}>Чистый поток по категории</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {period.categories.map(cat => (
                                                            <tr key={cat.category_id}>
                                                                <td style={tdStyle}>{cat.category_name}</td>
                                                                <td style={{ ...tdStyle, color: 'green' }}>{formatAmount(cat.income)}</td>
                                                                <td style={{ ...tdStyle, color: 'red' }}>{formatAmount(cat.expense)}</td>
                                                                <td style={{ ...tdStyle, color: cat.net >= 0 ? 'green' : 'red' }}>
                                                                    {cat.net >= 0 ? '+' : ''}{formatAmount(cat.net)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {expandedPeriods[period.period] && (!period.categories || period.categories.length === 0) && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '10px', background: '#f9f9f9' }}>
                                            Нет категорий за этот период
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default CashFlow;