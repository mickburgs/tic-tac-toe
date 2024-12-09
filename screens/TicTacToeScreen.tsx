import React, {useRef, useState} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import { globalStyles } from '../components/globalStyles';
import {GameMode} from "../types/GameMode";
import {Player, PlayerColor} from "../types/Player";
import {WinningCombination} from "../types/WinningCombination";
import {Difficulty} from "../types/Difficulty";
import {getWinningCombinations} from "../utils/gameUtils";

const BOARD_SIZE = 9;
const EMPTY_BOARD: Player[] = Array(BOARD_SIZE).fill(null);
const AI_PLAYER = Player.O;

const TicTacToeScreen = ({route}) => {
    const {mode, difficulty} = route.params;
    const [board, setBoard] = useState(EMPTY_BOARD);
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState<WinningCombination>(null);
    const [isLocked, setIsLocked] = useState(false);

    const boardGlow = useRef(new Animated.Value(0)).current;
    const cellAnimations = useRef(Array(BOARD_SIZE).fill(null).map(() => new Animated.Value(1))).current;

    const updateBoard = (board: Player[], index: number, player: Player): Player[] => {
        if (board[index] !== null || winner || isLocked) return;

        const newBoard = [...board];
        newBoard[index] = player;
        setBoard(newBoard);
        return newBoard;
    };

    const handlePress = (index) => {
        const newBoard = updateBoard(board, index, isXNext ? Player.X : Player.O);
        if (!newBoard) return;

        const winningCombination = getWinningCombination(newBoard);
        if (winningCombination) {
            setGameWinner(winningCombination);
            return;
        }

        if (mode === GameMode.Single && isXNext) {
            setIsLocked(true);
            setTimeout(() => makeAIMove(newBoard), 500);
        }
        setIsXNext(!isXNext);
    };

    const setGameWinner = (win: WinningCombination) => {
        setWinner(win);

        animateWinningCells(win.indices);
        startGlowAnimation();
    };

    const animateWinningCells = (indices: number[]) => {
        indices.forEach((index) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(cellAnimations[index], {
                        toValue: 1.5, // Scale up
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(cellAnimations[index], {
                        toValue: 1, // Scale down
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    };

    const playerHasAllButOneInCombination = (board: string[], a: number, b: number, c: number, player: Player) => {
        return [board[a], board[b], board[c]]
            .filter((cell) => cell === player)
            .length === 2;
    };

    const getWinningMove = (board: Player[], a: number, b: number, c: number, player: Player): number => {
        if (playerHasAllButOneInCombination(board, a, b, c, player)) {
            const emptyCell = getEmptyCell(board, a, b, c);
            if (emptyCell) {
                return emptyCell;
            }
        }
        return null;
    };

    const getEmptyCell = (board: Player[], a: number, b: number, c: number): number => {
        return [a, b, c].find((index) => board[index] === null);
    }

    const findWinningMove = (board: Player[], player: Player) => {
        for (let combination of getWinningCombinations()) {
            const [a, b, c] = combination;
            const winningMove = getWinningMove(board, a, b, c, player);
            if (winningMove === null) {
                continue;
            }
            return winningMove;
        }
        return null;
    }

    const makeAIMove = (board: Player[]) => {
        for (let combination of getWinningCombinations()) {
            const [a, b, c] = combination;
            const winningMove = getWinningMove(board, a, b, c, AI_PLAYER);
            if (winningMove === null) {
                continue;
            }
            updateBoard(board, winningMove, AI_PLAYER);
            setGameWinner({
                filledCell: winningMove,
                indices: [a, b, c],
                player: AI_PLAYER,
            });
            return;
        }

        const nextMove = getAiMove(board);
        updateBoard(board, nextMove, AI_PLAYER);
        const gameWinner = getWinningCombination(board);
        if (gameWinner) {
            setGameWinner(gameWinner);
        } else {
            setIsXNext(true);
        }
        setIsLocked(false);
    };

    const getAiMove = (board: Player[]): number => {
        if (difficulty === Difficulty.Hard) {
            const winningMove = findWinningMove(board, Player.X);
            if (winningMove !== null) {
                return winningMove;
            }
        }
        return getRandomMove(board);
    }

    const getRandomMove = (board: Player[]): number => {
        const emptyCells = board.map((cell, i) => (cell === null ? i : null)).filter((i) => i !== null);
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    const resetGame = () => {
        setBoard(EMPTY_BOARD);
        setIsXNext(true);
        setWinner(null);
        setIsLocked(false);

        cellAnimations.forEach((anim) => anim.setValue(1));

        Animated.timing(boardGlow, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const getWinningCombination = (board): WinningCombination => {
        for (let combination of getWinningCombinations()) {
            const [a, b, c] = combination;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return {
                    filledCell: getEmptyCell(board, a, b, c),
                    indices: [a, b, c],
                    player: board[a],
                };
            }
        }
        return null;
    };

    const startGlowAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(boardGlow, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: false,
                }),
                Animated.timing(boardGlow, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    };

    const renderCell = (index) => (
        <TouchableOpacity
            style={styles.cell}
            onPress={() => handlePress(index)}
            disabled={isLocked}
        >
            <Animated.View
                style={{
                    transform: [{scale: cellAnimations[index]}],
                }}
            >
                <Text style={[styles.cellText, {color: getPlayerColor(board[index])}]}>
                    {board[index]}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );

    const getPlayerColor = (player: Player): string => {
        if (!player) return '#555';
        return PlayerColor[player];
    }

    const getPostGameColor = () => {
        return getPlayerColor(winner?.player);
    }

    return (
        <View style={globalStyles.container}>
            <Text
                style={[
                    styles.status,
                    {color: getPostGameColor()},
                ]}
            >
                {winner
                    ? `Winnaar: ${winner.player}`
                    : `Volgende speler: ${isXNext ? Player.X : Player.O}`}
            </Text>
            <Animated.View
                style={[
                    styles.board,
                    {
                        shadowColor: 'black',
                        shadowOpacity: boardGlow,
                        shadowRadius: 20,
                        borderColor: boardGlow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [
                                'black',
                                getPostGameColor()
                            ],
                        }),
                    },
                ]}
            >
                {[0, 1, 2].map((row) => (
                    <View key={row} style={styles.row}>
                        {renderCell(row * 3)}
                        {renderCell(row * 3 + 1)}
                        {renderCell(row * 3 + 2)}
                    </View>
                ))}
            </Animated.View>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                <Text style={styles.resetButtonText}>Herstart Spel</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    status: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 20,
    },
    board: {
        width: 300,
        height: 300,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#333',
        borderRadius: 10,
        overflow: 'hidden',
    },
    row: {
        flex: 1,
        flexDirection: 'row',
    },
    cell: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fafafa',
    },
    cellText: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    resetButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 30,
        backgroundColor: '#4caf50',
        borderRadius: 5,
    },
    resetButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
});

export default TicTacToeScreen;
