import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Heading,
    Text,
    Link,
    Alert,
    AlertIcon,
    Container,
    InputGroup,
    InputLeftElement,
} from '@chakra-ui/react';
import { EmailIcon, LockIcon } from '@chakra-ui/icons';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Неверный email или пароль');
        }
    };

    return (
        <Container maxW="md" py={10}>
            <Box
                p={8}
                borderWidth={1}
                borderRadius="lg"
                boxShadow="lg"
                bg="white"
                _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
            >
                <VStack spacing={6} as="form" onSubmit={handleSubmit}>
                    <Heading size="lg" color="blue.600" _dark={{ color: 'blue.300' }}>
                        Вход
                    </Heading>

                    {error && (
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <EmailIcon color="gray.300" />
                            </InputLeftElement>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@mail.com"
                            />
                        </InputGroup>
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel>Пароль</FormLabel>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <LockIcon color="gray.300" />
                            </InputLeftElement>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </InputGroup>
                    </FormControl>

                    <Button
                        type="submit"
                        colorScheme="blue"
                        width="full"
                        size="lg"
                    >
                        Войти
                    </Button>

                    <Text>
                        Нет аккаунта?{' '}
                        <Link as={RouterLink} to="/register" color="blue.500">
                            Зарегистрируйтесь
                        </Link>
                    </Text>
                </VStack>
            </Box>
        </Container>
    );
};

export default Login;