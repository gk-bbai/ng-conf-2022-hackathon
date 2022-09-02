import { Commands, IGameState, IPlayer } from './models';

const coinCount = 100;
const shipWidth = 10;
const coinWidth = 2;

export function getInitialState(): IGameState {
    return {
        players: [],
        coins: [],
        fieldSize: {
            width: 100,
            height: 100,
        },
        eliminatedPlayers: {},
    };
}

export function gameLogic(state: IGameState, commands: Commands): IGameState {
    evaluateCommands(state, commands);
    resolveCoinCollisions(state);
    resolvePlayerCollisions(state);
    addMoreCoins(state);
    return state;
}

function evaluateCommands(state: IGameState, commands: Commands) {
    Object.keys(commands).forEach(playerId => {
        const player = state.players.find(p => p.id === playerId);
        if (!player) {
            return;
        }
        const command = commands[playerId];
        player.direction = command;
        if (command === 'up') {
            const newY = player.y - 1;
            if (newY < 0) {
                return;
            }
            player.y = newY;
        } else if (command === 'down') {
            const newY = player.y + 1;
            if (newY > state.fieldSize.height) {
                return;
            }
            player.y = newY;
        } else if (command === 'left') {
            const newX = player.x - 1;
            if (newX < 0) {
                return;
            }
            player.x = newX;
        } else if (command === 'right') {
            const newX = player.x + 1;
            if (newX > state.fieldSize.width) {
                return;
            }
            player.x = newX;
        }
    });
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    const deltaX = a.x - b.x;
    const deltaY = a.y - b.y;

    // console.log(Math.sqrt(deltaX * deltaX + deltaY * deltaY));

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function resolveCoinCollisions(state: IGameState) {
    state.coins.slice().forEach(coin => {
        const player = state.players.find(p => distance(p, coin) < coinWidth);
        if (player) {
            player.score++;
            state.coins = state.coins.filter(c => c !== coin);
        }
    });
}

function resolvePlayerCollisions(state: IGameState) {
    state.players.slice().forEach(player => {
        if (!state.players.includes(player)) {
            return;
        }
        const otherPlayer = state.players.find(
            otherPlayer =>
                otherPlayer !== player && distance(otherPlayer, player) < shipWidth,
        );
        if (otherPlayer) {
            const pool = 2;
            const roll = Math.floor(Math.random() * pool);
            let winner: IPlayer;
            let loser: IPlayer;
            if (roll === 1) {
                winner = player;
                loser = otherPlayer;
            } else {
                winner = otherPlayer;
                loser = player;
            }
            winner.score += loser.score;
            state.players = state.players.filter(p => p !== loser);
            state.eliminatedPlayers[loser.id] = winner.id;
        }
    });
}

function addMoreCoins(state: IGameState) {
    while (state.coins.length < coinCount) {
        const location = getUnoccupiedLocation(state);
        const isDeadly = Math.floor(Math.random() * 2) === 1;
        state.coins.push({ ...location, isDeadly });
    }
}

export function getUnoccupiedLocation(state: IGameState): {
    x: number;
    y: number;
} {
    let location = null;
    while (!location) {
        const x = Math.floor(Math.random() * state.fieldSize.width);
        const y = Math.floor(Math.random() * state.fieldSize.height);
        if (state.players.find(player => distance(player, { x, y }) < shipWidth)) {
            continue;
        }
        if (state.coins.find(coin => distance(coin, { x, y }) < coinWidth)) {
        // if (state.coins.find(c => c.x === x && c.y === y)) {
            continue;
        }
        location = { x, y };
    }
    return location;
}
