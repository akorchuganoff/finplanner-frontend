import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Heading,
    FormControl,
    FormLabel,
    Input,
    Select,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    HStack,
    Grid,
    GridItem,
    useToast,
    Spinner,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    IconButton,
    useDisclosure,
    useColorMode,
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { getCategories } from '../services/categories';
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
} from '../services/transactions';

const Transactions = () => {
    // Все хуки вызываются в одном порядке при каждом рендере
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
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = useRef();
    const toast = useToast();
    const { colorMode } = useColorMode(); // вместо useColorModeValue

    // Цвета в зависимости от темы
    const bgForm = colorMode === 'light' ? 'gray.50' : 'gray.700';
    const bgOddRow = colorMode === 'light' ? 'gray.50' : 'gray.700';
    const bgEvenRow = colorMode === 'light' ? 'white' : 'gray.800';
    const hoverRowBg = colorMode === 'light' ? 'gray.100' : 'gray.600';

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
                toast({
                    title: 'Ошибка загрузки',
                    description: 'Не удалось загрузить данные',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.date || !formData.category_id) {
            toast({
                title: 'Ошибка',
                description: 'Заполните сумму, дату и категорию',
                status: 'warning',
                duration: 2000,
            });
            return;
        }

        setSubmitting(true);
        try {
            if (editingId) {
                await updateTransaction(editingId, formData);
                toast({ title: 'Успешно', description: 'Транзакция обновлена', status: 'success', duration: 2000 });
            } else {
                await createTransaction(formData);
                toast({ title: 'Успешно', description: 'Транзакция добавлена', status: 'success', duration: 2000 });
            }
            const updatedTransactions = await getTransactions();
            setTransactions(updatedTransactions);
            resetForm();
        } catch (error) {
            console.error(error);
            toast({ title: 'Ошибка', description: 'Не удалось сохранить транзакцию', status: 'error', duration: 3000 });
        } finally {
            setSubmitting(false);
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        onOpen();
    };

    const confirmDelete = async () => {
        try {
            await deleteTransaction(deleteId);
            const updatedTransactions = await getTransactions();
            setTransactions(updatedTransactions);
            toast({ title: 'Удалено', description: 'Транзакция удалена', status: 'info', duration: 2000 });
        } catch (error) {
            console.error(error);
            toast({ title: 'Ошибка', description: 'Не удалось удалить транзакцию', status: 'error', duration: 3000 });
        } finally {
            onClose();
            setDeleteId(null);
        }
    };

    const filteredCategories = categories.filter(
        (cat) => cat.category_type === formData.transaction_type
    );

    // Ранний return только ПОСЛЕ всех хуков
    if (loading) {
        return (
            <Box textAlign="center" py={10}>
                <Spinner size="xl" />
                <Heading size="md" mt={4}>Загрузка транзакций...</Heading>
            </Box>
        );
    }

    return (
        <Container maxW="container.xl" py={4}>
            <Heading mb={6} size="lg">Управление транзакциями</Heading>

            <Box
                as="form"
                onSubmit={handleSubmit}
                bg={bgForm}
                p={6}
                borderRadius="lg"
                shadow="md"
                mb={8}
            >
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
                    <GridItem>
                        <FormControl isRequired>
                            <FormLabel>Тип</FormLabel>
                            <Select name="transaction_type" value={formData.transaction_type} onChange={handleInputChange}>
                                <option value="expense">Расход</option>
                                <option value="income">Доход</option>
                            </Select>
                        </FormControl>
                    </GridItem>
                    <GridItem>
                        <FormControl isRequired>
                            <FormLabel>Сумма (₽)</FormLabel>
                            <Input type="number" name="amount" placeholder="0.00" value={formData.amount} onChange={handleInputChange} step="0.01" />
                        </FormControl>
                    </GridItem>
                    <GridItem>
                        <FormControl isRequired>
                            <FormLabel>Дата</FormLabel>
                            <Input type="date" name="date" value={formData.date} onChange={handleInputChange} />
                        </FormControl>
                    </GridItem>
                    <GridItem>
                        <FormControl isRequired>
                            <FormLabel>Категория</FormLabel>
                            <Select name="category_id" value={formData.category_id} onChange={handleInputChange}>
                                <option value="">Выберите категорию</option>
                                {filteredCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </Select>
                        </FormControl>
                    </GridItem>
                    <GridItem colSpan={{ base: 1, md: 2, lg: 3 }}>
                        <FormControl>
                            <FormLabel>Комментарий</FormLabel>
                            <Input type="text" name="comment" placeholder="Необязательно" value={formData.comment} onChange={handleInputChange} />
                        </FormControl>
                    </GridItem>
                    <GridItem>
                        <HStack spacing={2} mt={8}>
                            <Button type="submit" colorScheme={editingId ? 'yellow' : 'green'} leftIcon={<FiPlus />} isLoading={submitting}>
                                {editingId ? 'Сохранить' : 'Добавить'}
                            </Button>
                            {editingId && <Button leftIcon={<FiX />} onClick={resetForm} variant="ghost">Отмена</Button>}
                        </HStack>
                    </GridItem>
                </Grid>
            </Box>

            <Box overflowX="auto">
                <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
                    <Thead>
                        <Tr>
                            <Th>Дата</Th>
                            <Th>Сумма</Th>
                            <Th>Тип</Th>
                            <Th>Категория</Th>
                            <Th>Комментарий</Th>
                            <Th textAlign="center">Действия</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {transactions.length === 0 ? (
                            <Tr><Td colSpan={6} textAlign="center">Нет транзакций. Добавьте первую!</Td></Tr>
                        ) : (
                            transactions.map((tx, idx) => (
                                <Tr
                                    key={tx.id}
                                    bg={idx % 2 === 0 ? bgEvenRow : bgOddRow}
                                    _hover={{ bg: hoverRowBg }}
                                >
                                    <Td>{tx.date}</Td>
                                    <Td fontWeight="bold" color={tx.transaction_type === 'income' ? 'green.500' : 'red.500'}>
                                        {tx.amount} ₽
                                    </Td>
                                    <Td>{tx.transaction_type === 'income' ? 'Доход' : 'Расход'}</Td>
                                    <Td>{categories.find((c) => c.id === tx.category_id)?.name}</Td>
                                    <Td>{tx.comment || '—'}</Td>
                                    <Td>
                                        <HStack spacing={2}>
                                            <IconButton icon={<FiEdit />} size="sm" colorScheme="blue" variant="ghost" onClick={() => handleEdit(tx)} aria-label="Редактировать" />
                                            <IconButton icon={<FiTrash2 />} size="sm" colorScheme="red" variant="ghost" onClick={() => handleDeleteClick(tx.id)} aria-label="Удалить" />
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </Tbody>
                </Table>
            </Box>

            <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">Удаление транзакции</AlertDialogHeader>
                        <AlertDialogBody>Вы уверены? Это действие нельзя отменить.</AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>Отмена</Button>
                            <Button colorScheme="red" onClick={confirmDelete} ml={3}>Удалить</Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Container>
    );
};

export default Transactions;