use std::fmt::Display;

use gomoku::game::SimpleGomokuGame;
use gomoku::{error::GomokuError, stone::Stone};
use serde::Serialize;
use serde::ser::SerializeTuple;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen(js_namespace = console)]
extern "C" {
    fn log(s: &str);
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Color {
    Black = 0,
    White = 1,
    Empty = 2,
}

impl Display for Color {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Color::Black => write!(f, "Black"),
            Color::White => write!(f, "White"),
            Color::Empty => write!(f, "Empty"),
        }
    }
}

#[wasm_bindgen]
pub fn color_to_string(color: Color) -> String {
    color.to_string()
}

impl serde::Serialize for Color {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_u8(*self as u8)
    }
}

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GameStatus {
    Ok,
    InvalidMove,
    BlackWin,
    WhiteWin,
    Draw,
}

impl From<gomoku::error::Result<()>> for GameStatus {
    fn from(value: gomoku::error::Result<()>) -> Self {
        match value {
            Ok(()) => GameStatus::Ok,
            Err(err) => match err {
                GomokuError::StoneAlreadyPlaced
                | GomokuError::InvalidMove
                | GomokuError::IndexOutOfBound => GameStatus::InvalidMove,
                GomokuError::GameOverWithWinner(winner) => match winner {
                    Stone::Black => GameStatus::BlackWin,
                    Stone::White => GameStatus::WhiteWin,
                },
                GomokuError::GameOverWithDraw => GameStatus::Draw,
            },
        }
    }
}

// #[wasm_bindgen]
// pub enum ComputerStrength {
//     Random,
//     Simple,
//     Weighted,
// }

// #[wasm_bindgen]
// pub fn str_to_computer_strength(s: &str) -> ComputerStrength {
//     match s {
//         "random" => ComputerStrength::Random,
//         "simple" => ComputerStrength::Simple,
//         "weighted" => ComputerStrength::Weighted,
//         _ => ComputerStrength::Weighted
//     }
// }

#[wasm_bindgen]
pub struct Point {
    pub x: usize,
    pub y: usize,
}

#[wasm_bindgen]
impl Point {
    #[wasm_bindgen(constructor)]
    pub fn new(x: usize, y: usize) -> Point {
        Point { x, y }
    }
}

impl From<gomoku::point::Point> for Point {
    fn from(value: gomoku::point::Point) -> Self {
        Self { x: value.x, y: value.y }
    }
}

impl Serialize for Point {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: serde::Serializer {
        let mut tuple = serializer.serialize_tuple(2)?;
        tuple.serialize_element(&self.x)?;
        tuple.serialize_element(&self.y)?;
        tuple.end()
        
    }
}

#[wasm_bindgen]
pub struct Game {
    game: SimpleGomokuGame,
    // player_mgr: PlayerManager,
}

#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new(/* is_human: bool, computer_strength: ComputerStrength */) -> Game {
        // let computer: Box<dyn Computer> = match computer_strength {
        //     ComputerStrength::Random => Box::new(RandomComputer::new(Stone::White)),
        //     ComputerStrength::Simple => Box::new(SimpleComputer::new(Stone::White)),
        //     ComputerStrength::Weighted => Box::new(WeightedComputer::new(Stone::White)),
        // };

        // let white = if is_human {
        //     PlayerType::Human
        // } else {
        //     PlayerType::Computer(computer)
        // };

        Game {
            game: SimpleGomokuGame::with_size(11),
            // player_mgr: PlayerManager::new(PlayerType::Human, white),
        }
    }

    // pub fn decide(&self) -> Option<Point> {
    //     self.player_mgr.decide(self.game.board(), self.game.turn()).map(|p| p.into())
    // }

    pub fn put(&mut self, x: usize, y: usize) -> GameStatus {
        let result = self.game.put_stone(x, y).into();
        log(&format!("{:?}", result));
        result
    }

    /// Get the board
    /// returns Vec<Vec<Color>>
    pub fn get_board(&self) -> JsValue {
        let result: Vec<Vec<Color>> = self
            .game
            .board()
            .board()
            .iter()
            .map(|rows| {
                rows.iter()
                    .map(|cell| match cell {
                        Some(Stone::Black) => Color::Black,
                        Some(Stone::White) => Color::White,
                        None => Color::Empty,
                    })
                    .collect()
            })
            .collect();

        serde_wasm_bindgen::to_value(&result).unwrap()
    }

    pub fn in_range(&self, x: usize, y: usize) -> bool {
        self.game.board().in_range(x, y)
    }

    pub fn get_turn(&self) -> Color {
        match self.game.turn() {
            Stone::Black => Color::Black,
            Stone::White => Color::White,
        }
    }

    pub fn check_already_put(&self, x: usize, y: usize) -> bool {
        self.game.board().get_at(x, y).is_some()
    }
}

impl Default for Game {
    fn default() -> Self {
        Self::new()
    }
}
