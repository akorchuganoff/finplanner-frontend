import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Heading,
    Flex,
    FormLabel,
    Input,
    Button,
    Select,
    useToast,
    useColorModeValue,
    VStack,
    HStack,
    Text,
    Divider,
    Card,
    CardBody,
    IconButton,
    CloseButton,
    Badge,
    Tooltip,
} from '@chakra-ui/react';
import { AddIcon, RepeatIcon, DeleteIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Virtuoso } from 'react-virtuoso';
import api from '../services/api';
import { getCategories } from '../services/categories';

const STORAGE_KEY = 'import_preview_data';

// Компонент строки таблицы (мемоизирован)
const TransactionRow = React.memo(({
    tx,
    onCategoryChange,
    onDragStart,
    highlightNoCategory,
    borderColor,
    bgColorOdd,
    bgColorEven,
    hoverBg,
    redBgLight,
    categories, // передаём весь массив, фильтруем на месте
}) => {
    const handleCategorySelect = (e) => {
        const value = e.target.value;
        onCategoryChange(tx.tempId, value ? parseInt(value) : null);
    };

    let bg = tx.index % 2 === 0 ? bgColorEven : bgColorOdd;
    if (highlightNoCategory && !tx.category_id) {
        bg = redBgLight;
    }

    // Фильтруем категории по типу транзакции
    const filteredCats = categories.filter(cat => cat.category_type === tx.type);

    return (
        <Flex
            borderBottom="1px solid"
            borderColor={borderColor}
            alignItems="center"
            bg={bg}
            _hover={{ bg: hoverBg }}
            minH="48px"
        >
            <Box flex="0 0 120px" px={2} py={2}>
                <Text fontSize="sm">{tx.date}</Text>
            </Box>
            <Box flex="0 0 120px" px={2} py={2}>
                <Text fontSize="sm" color={tx.type === 'income' ? 'green.500' : 'red.500'} fontWeight="medium">
                    {tx.type === 'income' ? '+' : '-'}{Math.abs(tx.amount).toFixed(2)} ₽
                </Text>
            </Box>
            <Box flex="1" px={2} py={2} draggable onDragStart={(e) => onDragStart(e, tx.description)} cursor="grab">
                <Text fontSize="sm" noOfLines={1}>
                    {tx.description}
                </Text>
            </Box>
            <Box flex="0 0 200px" px={2} py={2}>
                <Select
                    size="sm"
                    value={tx.category_id || ''}
                    onChange={handleCategorySelect}
                    placeholder="— Выберите категорию —"
                >
                    {filteredCats.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </Select>
            </Box>
        </Flex>
    );
});

const Import = () => {
    // Состояния
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });
    const [filterUncategorized, setFilterUncategorized] = useState(false);
    const [draggedDescription, setDraggedDescription] = useState('');
    const [bulkCategoryId, setBulkCategoryId] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const toast = useToast();
    const dropZoneRef = useRef(null);

    // Цвета темы
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const tableHeaderBg = useColorModeValue('gray.100', 'gray.700');
    const stickyBg = useColorModeValue('white', 'gray.800');
    const bgColorOdd = useColorModeValue('white', 'gray.800');
    const bgColorEven = useColorModeValue('gray.50', 'gray.700');
    const hoverBg = useColorModeValue('gray.100', 'gray.700');
    const redBgLight = useColorModeValue('red.50', 'red.900');

    // Загрузка категорий при монтировании и при обновлении
    const loadCategories = useCallback(async () => {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch (err) {
            console.error('Ошибка загрузки категорий', err);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Восстановление кэша
    useEffect(() => {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setPreview(parsed);
                toast({ title: 'Восстановлены данные', description: `${parsed.length} транзакций`, status: 'info', duration: 3000 });
            } catch (e) { }
        }
    }, []);

    // Сохранение кэша
    useEffect(() => {
        if (preview) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(preview));
        else sessionStorage.removeItem(STORAGE_KEY);
    }, [preview]);

    // Фильтр
    const filteredPreview = useMemo(() => {
        if (!preview) return [];
        if (filterUncategorized) return preview.filter(tx => !tx.category_id);
        return preview;
    }, [preview, filterUncategorized]);

    const uncategorizedCount = useMemo(() => preview?.filter(tx => !tx.category_id).length || 0, [preview]);

    // Отмена импорта
    const handleCancelImport = () => {
        setPreview(null);
        setFile(null);
        sessionStorage.removeItem(STORAGE_KEY);
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        toast({ title: 'Импорт отменён', description: 'Все данные удалены', status: 'info', duration: 3000 });
    };

    // Загрузка файла
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type !== 'application/pdf') {
            toast({ title: 'Неверный формат', description: 'Загрузите PDF', status: 'error' });
            return;
        }
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/api/import/upload', formData);
            const transactions = response.data.transactions.map((tx, idx) => ({
                ...tx,
                tempId: idx,
                category_id: tx.suggested_category_id || null,
            }));
            setPreview(transactions);
            // Обновим категории на случай, если появились новые
            await loadCategories();
            toast({ title: 'Файл обработан', description: `Найдено ${transactions.length} транзакций`, status: 'success' });
        } catch {
            toast({ title: 'Ошибка', description: 'Не удалось разобрать файл', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = useCallback((tempId, categoryId) => {
        setPreview(prev => prev.map(tx => tx.tempId === tempId ? { ...tx, category_id: categoryId } : tx));
    }, []);

    const handleConfirm = async () => {
        const toImport = preview.filter(tx => tx.category_id);
        if (toImport.length === 0) {
            toast({ title: 'Нет транзакций для импорта', status: 'warning' });
            return;
        }
        try {
            await api.post('/api/import/confirm', toImport);
            toast({ title: 'Импорт выполнен', description: `Импортировано ${toImport.length} транзакций`, status: 'success' });
            handleCancelImport();
        } catch {
            toast({ title: 'Ошибка', description: 'Не удалось импортировать', status: 'error' });
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name.trim()) {
            toast({ title: 'Введите название', status: 'warning' });
            return;
        }
        try {
            await api.post('/api/categories', { name: newCategory.name, category_type: newCategory.type });
            await loadCategories(); // перезагружаем категории
            setShowNewCategoryForm(false);
            setNewCategory({ name: '', type: 'expense' });
            toast({ title: 'Категория создана', status: 'success' });
        } catch {
            toast({ title: 'Ошибка', description: 'Не удалось создать категорию', status: 'error' });
        }
    };

    // Drag & drop
    const onDragStart = useCallback((e, description) => {
        e.dataTransfer.setData('text/plain', description);
        setDraggedDescription(description);
    }, []);

    const onDragOver = (e) => {
        e.preventDefault();
        if (!dragActive) setDragActive(true);
    };
    const onDragLeave = () => setDragActive(false);
    const onDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        const description = e.dataTransfer.getData('text/plain');
        if (description) {
            setDraggedDescription(description);
            toast({ title: 'Описание добавлено', status: 'info', duration: 2000 });
        }
    };

    const applyCategoryToAllSameDescription = useCallback(() => {
        if (!draggedDescription || !bulkCategoryId) {
            toast({ title: 'Перетащите описание и выберите категорию', status: 'warning' });
            return;
        }
        setPreview(prev => prev.map(tx =>
            tx.description === draggedDescription ? { ...tx, category_id: bulkCategoryId } : tx
        ));
        const count = preview?.filter(tx => tx.description === draggedDescription).length || 0;
        toast({ title: 'Категория применена', description: `Обновлено ${count} транзакций`, status: 'success' });
    }, [draggedDescription, bulkCategoryId, preview]);

    const clearBulkSelection = () => {
        setDraggedDescription('');
        setBulkCategoryId('');
    };

    const toggleFilter = () => setFilterUncategorized(prev => !prev);

    return (
        <Box p={{ base: 4, md: 6 }}>
            <Heading size="lg" mb={6}>Импорт выписки из банка</Heading>

            <Flex direction={{ base: 'column', sm: 'row' }} gap={4} align={{ base: 'stretch', sm: 'flex-end' }} mb={6} p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
                <Box flex={1}>
                    <FormLabel htmlFor="file-input" mb={1}>Файл выписки (PDF)</FormLabel>
                    <Input id="file-input" type="file" accept=".pdf" onChange={handleFileChange} p={1} />
                </Box>
                <Button colorScheme="blue" onClick={handleUpload} isLoading={loading} loadingText="Загрузка..." isDisabled={!file || loading}>
                    Загрузить и разобрать
                </Button>
                {preview && (
                    <Button colorScheme="red" variant="outline" onClick={handleCancelImport}>
                        Отменить импорт
                    </Button>
                )}
            </Flex>

            {preview && (
                <>
                    <Box position="sticky" top={0} zIndex={10} bg={stickyBg} borderBottomWidth="1px" borderColor={borderColor} py={3} mb={4} boxShadow="sm">
                        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="center" wrap="wrap">
                            <Button leftIcon={<AddIcon />} colorScheme="green" variant="outline" onClick={() => setShowNewCategoryForm(prev => !prev)} size="sm">
                                Создать категорию
                            </Button>
                            <Button leftIcon={filterUncategorized ? <ViewOffIcon /> : <ViewIcon />} colorScheme="blue" variant="outline" onClick={toggleFilter} size="sm">
                                {filterUncategorized ? 'Показать все' : 'Только неразобранные'}
                            </Button>
                            <Badge colorScheme="red" fontSize="0.9em" px={2} py={1} borderRadius="full">
                                Неразобрано: {uncategorizedCount}
                            </Badge>
                            <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
                            <Flex ref={dropZoneRef} flex={1} direction={{ base: 'column', sm: 'row' }} gap={3} align="center"
                                p={2} borderWidth="2px" borderStyle="dashed" borderColor={dragActive ? 'blue.500' : borderColor}
                                bg={dragActive ? 'blue.50' : 'transparent'} borderRadius="md"
                                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
                                <Badge colorScheme="purple">Перетащите описание</Badge>
                                <Box flex={1} minW="150px">
                                    <Input size="sm" placeholder="Описание транзакции" value={draggedDescription} readOnly bg={useColorModeValue('gray.50', 'gray.700')} />
                                </Box>
                                <Box minW="150px">
                                    <Select size="sm" placeholder="Выберите категорию" value={bulkCategoryId} onChange={(e) => setBulkCategoryId(parseInt(e.target.value))}>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name} ({cat.category_type === 'income' ? 'Доход' : 'Расход'})</option>
                                        ))}
                                    </Select>
                                </Box>
                                <HStack>
                                    <Tooltip label="Применить ко всем с таким описанием">
                                        <Button size="sm" colorScheme="blue" onClick={applyCategoryToAllSameDescription} leftIcon={<RepeatIcon />}>Применить ко всем</Button>
                                    </Tooltip>
                                    <IconButton size="sm" icon={<DeleteIcon />} onClick={clearBulkSelection} variant="ghost" aria-label="Очистить" />
                                </HStack>
                            </Flex>
                        </Flex>

                        {showNewCategoryForm && (
                            <Card mt={3} variant="outline" bg={useColorModeValue('gray.50', 'gray.700')}>
                                <CardBody>
                                    <VStack align="stretch" spacing={3}>
                                        <Flex justify="space-between" align="center">
                                            <Text fontWeight="bold">Новая категория</Text>
                                            <CloseButton onClick={() => setShowNewCategoryForm(false)} />
                                        </Flex>
                                        <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                                            <Input placeholder="Название категории" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} flex={2} />
                                            <Select value={newCategory.type} onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })} flex={1}>
                                                <option value="expense">Расход</option>
                                                <option value="income">Доход</option>
                                            </Select>
                                            <HStack>
                                                <Button colorScheme="blue" onClick={handleCreateCategory}>Создать</Button>
                                                <Button variant="ghost" onClick={() => setShowNewCategoryForm(false)}>Отмена</Button>
                                            </HStack>
                                        </Flex>
                                    </VStack>
                                </CardBody>
                            </Card>
                        )}
                    </Box>

                    <Box borderWidth="1px" borderRadius="md" borderColor={borderColor} overflow="hidden">
                        <Flex bg={tableHeaderBg} p={2} fontWeight="bold" borderBottomWidth="1px" borderColor={borderColor}>
                            <Box flex="0 0 120px" px={2}>Дата</Box>
                            <Box flex="0 0 120px" px={2}>Сумма</Box>
                            <Box flex="1" px={2}>Описание (перетащите)</Box>
                            <Box flex="0 0 200px" px={2}>Категория</Box>
                        </Flex>
                        <Virtuoso
                            style={{ height: '600px' }}
                            totalCount={filteredPreview.length}
                            itemContent={(index) => {
                                const tx = filteredPreview[index];
                                return (
                                    <TransactionRow
                                        tx={{ ...tx, index }}
                                        onCategoryChange={handleCategoryChange}
                                        onDragStart={onDragStart}
                                        highlightNoCategory={true}
                                        borderColor={borderColor}
                                        bgColorOdd={bgColorOdd}
                                        bgColorEven={bgColorEven}
                                        hoverBg={hoverBg}
                                        redBgLight={redBgLight}
                                        categories={categories}
                                    />
                                );
                            }}
                        />
                    </Box>

                    <Flex justify="flex-end" mt={6}>
                        <Button colorScheme="blue" onClick={handleConfirm} size="lg">Подтвердить импорт</Button>
                    </Flex>
                </>
            )}
        </Box>
    );
};

export default Import;