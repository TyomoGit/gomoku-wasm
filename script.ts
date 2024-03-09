import init, * as wasm  from "./pkg/gomoku_wasm.js";

const BOARD_SIZE = 11;
const GRID_SIZE = 34;

const PADDING_SCALE = 0.5;
const OFFSET = GRID_SIZE * PADDING_SCALE;

const STONE_PADDING = 4;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const messageField = document.getElementById("messageField") as HTMLParagraphElement;
// const enemySelect = document.getElementById("enemySelect") as HTMLSelectElement;

// begin global variables
let turn: wasm.Color;
// let showingHints: boolean;
let game: wasm.Game;
let userCanPut = true;
// end global variables

init()
    .then(entry);

function entry() {
    reset();

    canvas.width = GRID_SIZE * (BOARD_SIZE-1) + GRID_SIZE*PADDING_SCALE*2;
    canvas.height = GRID_SIZE * (BOARD_SIZE-1) + GRID_SIZE*PADDING_SCALE*2;

    initEventListeners(canvas, ctx, messageField/*, enemySelect */);

    updateTurnMessage(messageField);
    drawBoard(canvas, ctx, game);
}

function reset() {
    // const isHuman = enemySelect.value == "human";
    
    game = new wasm.Game( /*isHuman, wasm.str_to_computer_strength(enemySelect.value) */);
    turn = game.get_turn();
    // showingHints = showHintsToggle.checked;
}

function initEventListeners(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    messageField: HTMLParagraphElement,
    /* enemySelect: HTMLSelectElement */
) {
    canvas.addEventListener('mousemove', (event) => {
        if (!userCanPut) {
            return;
        }
        const { x, y } = cursorCoord(event, canvas);

        if (game.check_already_put(x, y)) {
            return;
        }
        
        if (game.in_range(x, y)) {
            drawBoard(canvas, ctx, game);
            
            drawStone(x, y, turn, ctx, 0.5);
        }
    });

    canvas.addEventListener('click', async (event: MouseEvent) => {
        if (!userCanPut) {
            return;
        }
        // const timeout = (ms: number) => new Promise(handler => setTimeout(handler, ms));

        const { x, y } = cursorCoord(event, canvas);
        
        put(new wasm.Point(x, y));

        // const computerCanPut = put(new wasm.Point(x, y));

        // if (!computerCanPut) {
        //     console.log("can't put stone");
        //     return;
        // }

        // userCanPut = false;

        // const position_result_opt = game.decide();
        // if (position_result_opt) {
        //     while (game.get_turn() == wasm.Color.White) {
        //         await timeout(500);
        //         const _ = put(position_result_opt);
        //     }
        // } else {
        //     console.log("error");
        // }

        // userCanPut = true;
    });

    // enemySelect.addEventListener('change', (_) => {
    //     reset();
    //     drawBoard(canvas, ctx, game);
    //     console.log(`enemy: ${enemySelect.value}`);
        
    // });
}

function put(position: wasm.Point): boolean {
    if (!game.in_range(position.x, position.y)) {
        return false;
    }

    const status = game.put(position.x, position.y);
        switch (status) {
            case wasm.GameStatus.Ok:
                break;
            case wasm.GameStatus.BlackWin:
                messageField.innerHTML = "🎉🖤Black wins!🎉";
                drawBoard(canvas, ctx, game);
                userCanPut = false;
                return false;
            case wasm.GameStatus.WhiteWin:
                messageField.innerHTML = "🎉🤍White wins!🎉";
                drawBoard(canvas, ctx, game);
                userCanPut = false;
                return false;
            case wasm.GameStatus.Draw:
                messageField.innerHTML = "😮Draw.😮";
                drawBoard(canvas, ctx, game);
                userCanPut = false;
                return false;
            case wasm.GameStatus.InvalidMove:
                return false;
            default:
                // unreachable
                return false;
        }

        drawBoard(canvas, ctx, game);

        update_turn(messageField, ctx);

        return true;
}

function drawBoardGrid(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#41902a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'black';
    for (let i = 0; i < BOARD_SIZE; i++) {
        // horizontal
        ctx.beginPath();
        ctx.moveTo(OFFSET + i * GRID_SIZE, OFFSET);
        ctx.lineTo(OFFSET + i * GRID_SIZE, canvas.height - OFFSET);
        ctx.stroke();

        // vertical
        ctx.beginPath();
        ctx.moveTo(OFFSET, OFFSET + i * GRID_SIZE);
        ctx.lineTo(canvas.width - OFFSET, OFFSET + i * GRID_SIZE);
        ctx.stroke();
    }
}

function drawBoard(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, game: wasm.Game) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoardGrid(canvas, ctx);

    game.get_board().forEach((row: wasm.Color[], rowIndex: number) => {
        row.forEach((stone: wasm.Color, colIndex: number) => {
            if (stone == wasm.Color.Empty) { return; }
            drawStone(colIndex, rowIndex, stone, ctx, 1.0);
        })
    });
}

function drawStone(
    x: number,
    y: number,
    color: wasm.Color,
    ctx: CanvasRenderingContext2D,
    opacity: number
) {
    if (color == wasm.Color.Empty) {
        return;
    }
    
    ctx.fillStyle = color == wasm.Color.Black ? "black" : "white";
    ctx.beginPath();

    ctx.arc(
        x * GRID_SIZE + GRID_SIZE * PADDING_SCALE,
        y * GRID_SIZE + GRID_SIZE * PADDING_SCALE,
        OFFSET - STONE_PADDING,
        0,
        2 * Math.PI
    );
    ctx.globalAlpha = opacity;
    ctx.fill();
    ctx.globalAlpha = 1.0;
}

function cursorCoord(event: MouseEvent, canvas: HTMLCanvasElement): {x: number, y: number} {
    const clientRect = canvas.getBoundingClientRect();
    const x = event.clientX - clientRect.left;
    const y = event.clientY - clientRect.top;
    
    return {
        x: Math.round((x - GRID_SIZE*PADDING_SCALE) / GRID_SIZE),
        y: Math.round((y - GRID_SIZE*PADDING_SCALE) / GRID_SIZE)
    };
}

function update_turn(messageField: HTMLParagraphElement, ctx: CanvasRenderingContext2D) {
    turn = game.get_turn();

    updateTurnMessage(messageField);
}

function updateTurnMessage(messageField: HTMLParagraphElement) {
    messageField.innerHTML = turn == wasm.Color.Black
        ? "🖤Black's turn"
        : "🤍White's turn";
}
