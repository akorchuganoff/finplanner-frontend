import React, { useState, useEffect, useCallback, memo } from 'react';
import {
    Box,
    Heading,
    Flex,
    FormLabel,
    Select,
    Input,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Text,
    Spinner,
    Alert,
    AlertIcon,
    useColorModeValue,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { getCashFlowSummary } from '../services/dashboard';

// Мемоизированный компонент строки периода
const PeriodRow = memo(({ period, idx, isExpanded, onToggle, evenRowBg, hoverBg, borderColor, subTableBg }) => {
    const formatAmount = (amount) => {
        if (amount === undefined || amount === null) return '0.00 ₽';
        const num = typeof amount === 'number' ? amount : parseFloat(amount);
        if (isNaN(num)) return '0.00 ₽';
        return `${num.toFixed(2)} ₽`;
    };

    // Вычисляем итоги по категориям (если есть)
    const totalIncome = period.categories?.reduce((sum, cat) => sum + (Number(cat.income) || 0), 0) || 0;
    const totalExpense = period.categories?.reduce((sum, cat) => sum + (Number(cat.expense) || 0), 0) || 0;

    return (
        <React.Fragment>
            <Tr
                _odd={{ bg: idx % 2 === 0 ? 'inherit' : evenRowBg }}
                _hover={{ bg: hoverBg }}
            >
                <Td>{period.period}</Td>
                <Td color="green.500" fontWeight="medium">
                    {formatAmount(period.income)}
                </Td>
                <Td color="red.500" fontWeight="medium">
                    {formatAmount(period.expense)}
                </Td>
                <Td
                    color={period.net >= 0 ? 'green.500' : 'red.500'}
                    fontWeight="bold"
                >
                    {period.net >= 0 ? '+' : ''}
                    {formatAmount(period.net)}
                </Td>
                <Td>
                    <Button
                        size="sm"
                        variant="outline"
                        rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        onClick={() => onToggle(period.period)}
                    >
                        {isExpanded ? 'Скрыть категории' : 'Показать категории'}
                    </Button>
                </Td>
            </Tr>
            {isExpanded && (
                <Tr>
                    <Td colSpan={5} p={0}>
                        <Box
                            bg={subTableBg}
                            p={4}
                            ml={{ base: 0, md: 8 }}
                            borderTop="1px solid"
                            borderColor={borderColor}
                        >
                            {period.categories && period.categories.length > 0 ? (
                                <Box overflowX="auto">
                                    <Table size="sm" variant="unstyled">
                                        <Thead>
                                            <Tr>
                                                <Th>Категория</Th>
                                                <Th>Доходы</Th>
                                                <Th>Расходы</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {period.categories.map((cat) => (
                                                <Tr key={cat.category_id}>
                                                    <Td>{cat.category_name}</Td>
                                                    <Td color="green.500">
                                                        {formatAmount(cat.income)}
                                                    </Td>
                                                    <Td color="red.500">
                                                        {formatAmount(cat.expense)}
                                                    </Td>
                                                </Tr>
                                            ))}
                                            {/* Итоговая строка */}
                                            <Tr fontWeight="bold" bg={useColorModeValue('gray.100', 'gray.600')}>
                                                <Td>Итого</Td>
                                                <Td color="green.500">{formatAmount(totalIncome)}</Td>
                                                <Td color="red.500">{formatAmount(totalExpense)}</Td>
                                            </Tr>
                                        </Tbody>
                                    </Table>
                                </Box>
                            ) : (
                                <Text>Нет категорий за этот период</Text>
                            )}
                        </Box>
                    </Td>
                </Tr>
            )}
        </React.Fragment>
    );
});

const CashFlow = () => {
    const [summaryData, setSummaryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [groupBy, setGroupBy] = useState('day');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expandedPeriods, setExpandedPeriods] = useState({});

    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const evenRowBg = useColorModeValue('gray.50', 'gray.700');
    const subTableBg = useColorModeValue('gray.50', 'gray.700');
    const theadBg = useColorModeValue('gray.100', 'gray.600');
    const hoverBg = useColorModeValue('gray.100', 'gray.600');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { group_by: groupBy };
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            const data = await getCashFlowSummary(params);
            setSummaryData(data);
        } catch (err) {
            console.error(err);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [groupBy, startDate, endDate]);

    const togglePeriod = useCallback((periodKey) => {
        setExpandedPeriods(prev => ({
            ...prev,
            [periodKey]: !prev[periodKey],
        }));
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <Flex justify="center" py={10}>
                    <Spinner size="xl" />
                </Flex>
            );
        }
        if (error) {
            return (
                <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {error}
                </Alert>
            );
        }
        if (summaryData.length === 0) {
            return <Text>Нет данных за выбранный период</Text>;
        }
        return (
            <Box overflowX="auto">
                <Table variant="simple" borderWidth="1px" borderColor={borderColor}>
                    <Thead bg={theadBg}>
                        <Tr>
                            <Th>Период</Th>
                            <Th>Доходы</Th>
                            <Th>Расходы</Th>
                            <Th>Чистый поток</Th>
                            <Th>Детали</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {summaryData.map((period, idx) => (
                            <PeriodRow
                                key={period.period}
                                period={period}
                                idx={idx}
                                isExpanded={!!expandedPeriods[period.period]}
                                onToggle={togglePeriod}
                                evenRowBg={evenRowBg}
                                hoverBg={hoverBg}
                                borderColor={borderColor}
                                subTableBg={subTableBg}
                            />
                        ))}
                    </Tbody>
                </Table>
            </Box>
        );
    };

    return (
        <Box p={{ base: 4, md: 6 }}>
            <Heading size="lg" mb={6}>
                Отчёт о движении денежных средств
            </Heading>

            <Flex gap={4} wrap="wrap" mb={6} align="flex-end">
                <Box>
                    <FormLabel htmlFor="groupBy" mb={1}>
                        Группировка
                    </FormLabel>
                    <Select
                        id="groupBy"
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        width="150px"
                    >
                        <option value="day">По дням</option>
                        <option value="month">По месяцам</option>
                        <option value="quarter">По кварталам</option>
                    </Select>
                </Box>

                <Box>
                    <FormLabel htmlFor="startDate" mb={1}>
                        Начало
                    </FormLabel>
                    <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        width="auto"
                    />
                </Box>

                <Box>
                    <FormLabel htmlFor="endDate" mb={1}>
                        Конец
                    </FormLabel>
                    <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        width="auto"
                    />
                </Box>
            </Flex>

            {renderContent()}
        </Box>
    );
};

export default CashFlow;