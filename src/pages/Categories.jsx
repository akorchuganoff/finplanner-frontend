import React, { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    FormControl,
    FormLabel,
    Input,
    Select,
    Button,
    HStack,
    VStack,
    SimpleGrid,
    List,
    ListItem,
    IconButton,
    Flex,
    Spinner,
    Text,
    useToast,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categories';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category_type: 'expense',
    });
    const [loading, setLoading] = useState(false);
    const toast = useToast();

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
            toast({
                title: 'Ошибка загрузки',
                description: 'Не удалось загрузить категории',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
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
                toast({
                    title: 'Категория обновлена',
                    status: 'success',
                    duration: 2000,
                });
            } else {
                await createCategory(formData.name, formData.category_type);
                toast({
                    title: 'Категория создана',
                    status: 'success',
                    duration: 2000,
                });
            }
            resetForm();
            await fetchCategories();
        } catch (error) {
            console.error('Ошибка сохранения категории', error);
            toast({
                title: 'Ошибка сохранения',
                description: 'Не удалось сохранить категорию',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
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
            toast({
                title: 'Категория удалена',
                status: 'success',
                duration: 2000,
            });
            await fetchCategories();
        } catch (error) {
            console.error('Ошибка удаления', error);
            toast({
                title: 'Ошибка удаления',
                description: 'Не удалось удалить категорию. Возможно, она используется в транзакциях.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    if (loading) {
        return (
            <Flex justify="center" align="center" minH="300px">
                <Spinner size="xl" thickness="4px" speed="0.65s" />
            </Flex>
        );
    }

    const incomeCategories = categories.filter(cat => cat.category_type === 'income');
    const expenseCategories = categories.filter(cat => cat.category_type === 'expense');

    return (
        <Box>
            <Heading as="h2" size="lg" mb={6}>
                Управление категориями
            </Heading>

            {/* Форма добавления/редактирования */}
            <Box as="form" onSubmit={handleSubmit} mb={8} p={4} borderWidth="1px" borderRadius="lg">
                <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                        <FormLabel>Название категории</FormLabel>
                        <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Например: Продукты"
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel>Тип категории</FormLabel>
                        <Select
                            name="category_type"
                            value={formData.category_type}
                            onChange={handleInputChange}
                            isDisabled={!!editingId}
                        >
                            <option value="expense">Расход</option>
                            <option value="income">Доход</option>
                        </Select>
                    </FormControl>

                    <HStack spacing={4}>
                        <Button type="submit" colorScheme="blue" leftIcon={<AddIcon />}>
                            {editingId ? 'Сохранить' : 'Добавить'}
                        </Button>
                        {editingId && (
                            <Button type="button" onClick={resetForm} variant="ghost">
                                Отмена
                            </Button>
                        )}
                    </HStack>
                </VStack>
            </Box>

            {/* Список категорий: доходы и расходы */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                {/* Доходы */}
                <Box>
                    <Heading as="h3" size="md" mb={4} color="green.600">
                        Доходы
                    </Heading>
                    {incomeCategories.length === 0 ? (
                        <Text color="gray.500">Нет категорий доходов</Text>
                    ) : (
                        <List spacing={3}>
                            {incomeCategories.map(cat => (
                                <ListItem
                                    key={cat.id}
                                    p={2}
                                    borderWidth="1px"
                                    borderRadius="md"
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    <Text fontWeight="medium">{cat.name}</Text>
                                    {cat.user_id !== null && (
                                        <HStack spacing={2}>
                                            <IconButton
                                                icon={<EditIcon />}
                                                size="sm"
                                                colorScheme="yellow"
                                                variant="ghost"
                                                onClick={() => handleEdit(cat)}
                                                aria-label="Редактировать"
                                            />
                                            <IconButton
                                                icon={<DeleteIcon />}
                                                size="sm"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => handleDelete(cat.id)}
                                                aria-label="Удалить"
                                            />
                                        </HStack>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Расходы */}
                <Box>
                    <Heading as="h3" size="md" mb={4} color="red.600">
                        Расходы
                    </Heading>
                    {expenseCategories.length === 0 ? (
                        <Text color="gray.500">Нет категорий расходов</Text>
                    ) : (
                        <List spacing={3}>
                            {expenseCategories.map(cat => (
                                <ListItem
                                    key={cat.id}
                                    p={2}
                                    borderWidth="1px"
                                    borderRadius="md"
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    <Text fontWeight="medium">{cat.name}</Text>
                                    {cat.user_id !== null && (
                                        <HStack spacing={2}>
                                            <IconButton
                                                icon={<EditIcon />}
                                                size="sm"
                                                colorScheme="yellow"
                                                variant="ghost"
                                                onClick={() => handleEdit(cat)}
                                                aria-label="Редактировать"
                                            />
                                            <IconButton
                                                icon={<DeleteIcon />}
                                                size="sm"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => handleDelete(cat.id)}
                                                aria-label="Удалить"
                                            />
                                        </HStack>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            </SimpleGrid>
        </Box>
    );
};

export default Categories;