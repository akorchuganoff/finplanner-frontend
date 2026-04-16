import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom'; // <-- добавлен useNavigate
import {
    Box,
    Container,
    Heading,
    VStack,
    FormControl,
    FormLabel,
    Input,
    Button,
    Alert,
    AlertIcon,
    Text,
    Link,
    useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate(); // теперь работает

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        setIsLoading(true);
        try {
            await register(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Ошибка регистрации. Возможно, email уже используется.');
        } finally {
            setIsLoading(false);
        }
    };

    const bgColor = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    return (
        <Container maxW="md" py={10}>
            <Box
                bg={bgColor}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                boxShadow="lg"
                p={8}
            >
                <VStack spacing={6} align="stretch">
                    <Heading as="h2" size="xl" textAlign="center" color="brand.500">
                        Регистрация
                    </Heading>

                    {error && (
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    size="lg"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Пароль (не менее 8 символов)</FormLabel>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    size="lg"
                                    minLength={8}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Подтверждение пароля</FormLabel>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    size="lg"
                                />
                            </FormControl>

                            <Button
                                type="submit"
                                colorScheme="brand"
                                size="lg"
                                width="full"
                                isLoading={isLoading}
                                loadingText="Регистрация..."
                            >
                                Зарегистрироваться
                            </Button>
                        </VStack>
                    </form>

                    <Text textAlign="center">
                        Уже есть аккаунт?{' '}
                        <Link as={RouterLink} to="/login" color="brand.500" fontWeight="semibold">
                            Войдите
                        </Link>
                    </Text>
                </VStack>
            </Box>
        </Container>
    );
};

export default Register;