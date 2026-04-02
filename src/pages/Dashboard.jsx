import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Heading,
    Text,
    Select,
    Card,
    CardHeader,
    CardBody,
    Button,
    Spinner,
    useColorModeValue,
    SimpleGrid,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { getAggregated, getBalanceTimeline } from '../services/dashboard';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from 'recharts';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [months, setMonths] = useState(1);

    const [timelineData, setTimelineData] = useState([]);
    const [timelineGroupBy, setTimelineGroupBy] = useState('day');
    const [timelineLoading, setTimelineLoading] = useState(false);

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

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#F39C12', '#2ECC71'];

    const pieDataIncome = (data?.period_breakdown?.income || []).map(item => ({
        name: item.category_name,
        value: Number(item.amount),
    }));
    const pieDataExpense = (data?.period_breakdown?.expense || []).map(item => ({
        name: item.category_name,
        value: Number(item.amount),
    }));

    const cumulativeData = timelineData.reduce((acc, curr, index) => {
        const prevBalance = index > 0 ? acc[index - 1].cumulativeBalance : 0;
        acc.push({
            ...curr,
            cumulativeBalance: prevBalance + curr.balance,
        });
        return acc;
    }, []);

    const chartTextColor = useColorModeValue('#1A202C', '#F7FAFC');
    const chartGridColor = useColorModeValue('#E2E8F0', '#2D3748');
    const chartTooltipBg = useColorModeValue('white', '#1A202C');
    const chartTooltipBorder = useColorModeValue('#CBD5E0', '#4A5568');
    const chartLineColor = '#8884d8';

    if (loading) {
        return (
            <Flex justify="center" align="center" minH="50vh">
                <Spinner size="xl" />
            </Flex>
        );
    }

    if (!data) {
        return (
            <Box textAlign="center" py={10}>
                <Text color="red.500">Ошибка загрузки данных</Text>
            </Box>
        );
    }

    return (
        <Box>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4} mb={6}>
                <Box>
                    <Heading as="h1" size="lg">
                        Дашборд
                    </Heading>
                    <Text color="gray.500" mt={1}>
                        Добро пожаловать, {user?.email}!
                    </Text>
                </Box>
                <Button onClick={logout} colorScheme="red" variant="outline" size="sm">
                    Выйти
                </Button>
            </Flex>

            <Flex align="center" gap={4} mb={6}>
                <Text fontWeight="medium">Период:</Text>
                <Select
                    value={months}
                    onChange={(e) => setMonths(parseInt(e.target.value))}
                    width="auto"
                    size="md"
                >
                    <option value={1}>Последний месяц</option>
                    <option value={3}>Последние 3 месяца</option>
                    <option value={6}>Последние 6 месяцев</option>
                    <option value={12}>Последние 12 месяцев</option>
                </Select>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
                <Card variant="outline">
                    <CardHeader pb={0}>
                        <Heading size="md">Общий баланс</Heading>
                    </CardHeader>
                    <CardBody>
                        <Text fontSize="3xl" fontWeight="bold" color="green.500">
                            {Number(data.balance).toFixed(2)} ₽
                        </Text>
                    </CardBody>
                </Card>
                <Card variant="outline">
                    <CardHeader pb={0}>
                        <Heading size="md">Баланс за период</Heading>
                    </CardHeader>
                    <CardBody>
                        <Text fontSize="3xl" fontWeight="bold">
                            {Number(data.period_balance).toFixed(2)} ₽
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                            {data.period_start} – {data.period_end}
                        </Text>
                    </CardBody>
                </Card>
            </SimpleGrid>

            <Box mb={10}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={4} mb={4}>
                    <Heading as="h2" size="md">
                        Динамика баланса
                    </Heading>
                    <Select
                        value={timelineGroupBy}
                        onChange={(e) => setTimelineGroupBy(e.target.value)}
                        width="auto"
                        size="sm"
                    >
                        <option value="day">По дням</option>
                        <option value="month">По месяцам</option>
                        <option value="quarter">По кварталам</option>
                    </Select>
                </Flex>
                {timelineLoading ? (
                    <Flex justify="center" py={10}>
                        <Spinner />
                    </Flex>
                ) : cumulativeData.length > 0 ? (
                    <Box h="400px" w="100%">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cumulativeData}>
                                <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="period"
                                    tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                                    stroke={chartTextColor}
                                />
                                <YAxis stroke={chartTextColor} />
                                <Tooltip
                                    formatter={(value) => `${value.toFixed(2)} ₽`}
                                    contentStyle={{
                                        backgroundColor: chartTooltipBg,
                                        borderColor: chartTooltipBorder,
                                        borderRadius: '8px',
                                    }}
                                />
                                <Legend wrapperStyle={{ color: chartTextColor }} />
                                <Line
                                    type="monotone"
                                    dataKey="cumulativeBalance"
                                    name="Накопленный баланс"
                                    stroke={chartLineColor}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                ) : (
                    <Text textAlign="center" py={10} color="gray.500">
                        Нет данных для построения графика
                    </Text>
                )}
            </Box>

            {/* Две круговые диаграммы в ряд на десктопе, колонкой на мобильных */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={10}>
                <Box>
                    <Heading as="h2" size="md" mb={4} textAlign="center">
                        Структура доходов за период
                    </Heading>
                    {pieDataIncome.length > 0 ? (
                        <Box h="300px" w="100%">
                            <ResponsiveContainer width="100%" height="100%">
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
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: chartTooltipBg,
                                            borderColor: chartTooltipBorder,
                                            borderRadius: '8px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    ) : (
                        <Text textAlign="center" py={6} color="gray.500">
                            Нет данных о доходах за выбранный период
                        </Text>
                    )}
                </Box>

                <Box>
                    <Heading as="h2" size="md" mb={4} textAlign="center">
                        Структура расходов за период
                    </Heading>
                    {pieDataExpense.length > 0 ? (
                        <Box h="300px" w="100%">
                            <ResponsiveContainer width="100%" height="100%">
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
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: chartTooltipBg,
                                            borderColor: chartTooltipBorder,
                                            borderRadius: '8px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    ) : (
                        <Text textAlign="center" py={6} color="gray.500">
                            Нет данных о расходах за выбранный период
                        </Text>
                    )}
                </Box>
            </SimpleGrid>
        </Box>
    );
};

export default Dashboard;