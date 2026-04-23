// src/components/ChatWidget/ChatWidget.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    IconButton,
    Text,
    VStack,
    HStack,
    Button,
    Input,
    InputGroup,
    InputRightElement,
    Flex,
    Spinner,
    useToast,
    useDisclosure,
    Collapse,
    useColorModeValue,
    Heading,
} from '@chakra-ui/react';
import { ChatIcon, CloseIcon, ArrowUpIcon } from '@chakra-ui/icons';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CHAT_STORAGE_KEY = 'chat_widget_history';
const SESSION_STORAGE_KEY = 'chat_widget_session_id';

const ChatWidget = () => {
    const { isOpen, onToggle, onClose } = useDisclosure({ defaultIsOpen: false });
    const { user } = useAuth();

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);
    const toast = useToast();

    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const bgColor = useColorModeValue('white', 'gray.800');
    const userMessageBg = useColorModeValue('blue.100', 'blue.800');
    const assistantMessageBg = useColorModeValue('gray.100', 'gray.700');

    // Загрузка истории из localStorage при монтировании
    useEffect(() => {
        const savedHistory = localStorage.getItem(CHAT_STORAGE_KEY);
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                setMessages(parsed);
            } catch (e) {
                console.error('Failed to parse chat history', e);
            }
        }
        const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSessionId) {
            setSessionId(savedSessionId);
        }
    }, []);

    // Сохранение истории и sessionId в localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        } else {
            localStorage.removeItem(CHAT_STORAGE_KEY);
        }
    }, [messages]);

    useEffect(() => {
        if (sessionId) {
            localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        } else {
            localStorage.removeItem(SESSION_STORAGE_KEY);
        }
    }, [sessionId]);

    // Автопрокрутка вниз
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleGetAdvice = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.post('/api/ai/advice');
            const adviceMessage = {
                role: 'assistant',
                content: response.data.advice,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, adviceMessage]);
        } catch (error) {
            console.error('Error getting advice:', error);
            toast({
                title: 'Ошибка получения рекомендации',
                description: 'Не удалось загрузить аналитику. Попробуйте позже.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const sendMessage = useCallback(async () => {
        if (!inputMessage.trim()) return;

        const userMsg = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await api.post('/api/ai/chat', {
                message: inputMessage,
                session_id: sessionId,
            });
            const assistantMsg = {
                role: 'assistant',
                content: response.data.response,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            if (response.data.session_id) {
                setSessionId(response.data.session_id);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast({
                title: 'Ошибка отправки',
                description: 'Не удалось отправить сообщение.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            // Удаляем сообщение пользователя, так как оно не ушло
            setMessages((prev) => prev.filter((msg) => msg !== userMsg));
        } finally {
            setIsLoading(false);
        }
    }, [inputMessage, sessionId, toast]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!user) return null;

    return (
        <Box position="fixed" bottom="4" right="4" zIndex="1000" maxW="sm" w="full">
            {!isOpen && (
                <IconButton
                    icon={<ChatIcon />}
                    onClick={onToggle}
                    colorScheme="blue"
                    borderRadius="full"
                    size="lg"
                    aria-label="Открыть чат"
                    boxShadow="lg"
                />
            )}

            <Collapse in={isOpen} animateOpacity>
                <Box
                    w="sm"
                    h="xl"
                    bg={bgColor}
                    borderRadius="lg"
                    boxShadow="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                >
                    {/* Заголовок */}
                    <Flex
                        align="center"
                        justify="space-between"
                        p={3}
                        borderBottomWidth="1px"
                        borderColor={borderColor}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                    >
                        <Text fontWeight="bold">AI Финансовый Консультант</Text>
                        <IconButton
                            icon={<CloseIcon />}
                            onClick={onClose}
                            size="sm"
                            variant="ghost"
                            aria-label="Закрыть чат"
                        />
                    </Flex>

                    {/* Область сообщений */}
                    <Box flex={1} overflowY="auto" p={3} display="flex" flexDirection="column">
                        {messages.map((msg, idx) => (
                            <Flex
                                key={idx}
                                justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                                mb={3}
                            >
                                {msg.role === 'assistant' ? (
                                    <Box maxW="80%" bg={assistantMessageBg} p={3} borderRadius="lg">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => <Text fontSize="sm" mb={2} {...props} />,
                                                ul: ({ node, ...props }) => <Box as="ul" pl={4} mb={2} {...props} />,
                                                ol: ({ node, ...props }) => <Box as="ol" pl={4} mb={2} {...props} />,
                                                li: ({ node, ...props }) => <Text as="li" fontSize="sm" {...props} />,
                                                strong: ({ node, ...props }) => <Text as="strong" fontWeight="bold" {...props} />,
                                                h1: ({ node, ...props }) => <Heading size="md" mt={2} mb={1} {...props} />,
                                                h2: ({ node, ...props }) => <Heading size="sm" mt={2} mb={1} {...props} />,
                                                h3: ({ node, ...props }) => <Heading size="xs" mt={2} mb={1} {...props} />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                        <Text fontSize="xs" color="gray.400" textAlign="left" mt={2}>
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </Text>
                                    </Box>
                                ) : (
                                    <Box maxW="80%" bg={userMessageBg} p={2} borderRadius="lg">
                                        <Text fontSize="sm">{msg.content}</Text>
                                        <Text fontSize="xs" color="gray.400" textAlign="right" mt={1}>
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </Text>
                                    </Box>
                                )}
                            </Flex>
                        ))}
                        {isLoading && (
                            <Flex justify="flex-start" mb={3}>
                                <Box bg={assistantMessageBg} p={3} borderRadius="lg">
                                    <Spinner size="sm" />
                                </Box>
                            </Flex>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Панель действий и ввода */}
                    <Box p={2} borderTopWidth="1px" borderColor={borderColor}>
                        <Button
                            colorScheme="green"
                            size="sm"
                            onClick={handleGetAdvice}
                            isLoading={isLoading}
                            w="full"
                            mb={2}
                        >
                            Получить анализ трат
                        </Button>
                        <InputGroup size="md">
                            <Input
                                pr="4.5rem"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Введите сообщение..."
                                disabled={isLoading}
                            />
                            <InputRightElement width="3rem">
                                <IconButton
                                    h="1.75rem"
                                    size="sm"
                                    icon={<ArrowUpIcon />}
                                    onClick={sendMessage}
                                    isLoading={isLoading}
                                    aria-label="Отправить"
                                />
                            </InputRightElement>
                        </InputGroup>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
};

export default ChatWidget;