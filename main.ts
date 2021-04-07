tiles.setTilemap(tilemap`maze1`);

// Create some additional spritekinds
namespace SpriteKind {
    export const Clock = SpriteKind.create();
}

let newMaze: Array<Array<number>> = [];
let cols = 10;
let rows = 7;

// Create empty maze
for (let i = 0; i < rows; i++) {
    newMaze.push([]);
    for (let j = 0; j < cols; j++) {
        newMaze[i].push(0);
    }
}

function unvisitedCells(x:number, y:number) {
    let unvisited = [];
    if (y-1 >= 0 && newMaze[y-1][x] == newMaze[y][x]-1) unvisited.push([x, y-1]);
    if (y+1 < rows && newMaze[y+1][x] == newMaze[y][x]-1) unvisited.push([x, y+1]);
    if (x-1 >= 0 && newMaze[y][x-1] == newMaze[y][x]-1) unvisited.push([x-1, y]);
    if (x+1 < cols && newMaze[y][x+1] == newMaze[y][x]-1) unvisited.push([x+1, y]);
    return unvisited;
}

let createClock = true;
let clocks:Sprite[] = [];
let clocksPositions:Array<Array<number>> = [];

// Maze generation algoritm
let count = 0;
function generateMaze(x:number, y:number) {
    let unvisited;
    let ranCell;
    let nx;
    let ny;
    while (count != cols*rows-1) {
        newMaze[y][x] = 1;
        unvisited = unvisitedCells(x, y);
        if (unvisited.length == 0) {
            if (createClock) { // clock
                clocks.push(sprites.create(assets.image`clock`, SpriteKind.Clock));
                clocksPositions.push([x*2+1, y*2+1])
                createClock = false;
            }
            return;
        }
        createClock = true; // clock

        count += 1;
        ranCell = randint(0, unvisited.length-1);
        // Adding the generated random paths into the tilemap
        nx = unvisited[ranCell][0] - x;
        ny = unvisited[ranCell][1] - y;
        tiles.setTileAt(tiles.getTileLocation(x*2+1, y*2+1), assets.tile`mazeTile`);
        tiles.setTileAt(tiles.getTileLocation(unvisited[ranCell][0]*2+1, unvisited[ranCell][1]*2+1), assets.tile`mazeTile`);
        tiles.setTileAt(tiles.getTileLocation(x*2+1+nx, y*2+1+ny), assets.tile`mazeTile`);
        // Calling function again with the new random unvisited position
        generateMaze(unvisited[ranCell][0], unvisited[ranCell][1]);
    }
}


generateMaze(0, 0);

// Create walls
for (let i = 0; i < rows*2+1; i++) {
    for (let j = 0; j < cols*2+1; j++) {
        if (!tiles.tileAtLocationEquals(tiles.getTileLocation(j, i), assets.tile`mazeTile`)) {
            tiles.setWallAt(tiles.getTileLocation(j, i), true);
            tiles.setTileAt(tiles.getTileLocation(j, i), assets.tile`wallTile`);
        }
    }
}

// Create end of the maze
// in one of the other corners of the maze
let ranEnd = randint(0, 2);
switch (ranEnd) {
    case 0:
        tiles.setTileAt(tiles.getTileLocation(cols*2-1, rows*2-1), assets.tile`finish`);
        break;
    case 1:
        tiles.setTileAt(tiles.getTileLocation(cols*2-1, 1), assets.tile`finish`);
        break;
    case 2:
        tiles.setTileAt(tiles.getTileLocation(1, rows*2-1), assets.tile`finish`);
        break;
}

// Create clocks
for (let i = 0; i < clocks.length; i++) {
    if (!tiles.tileAtLocationEquals(tiles.getTileLocation(clocksPositions[i][0], clocksPositions[i][1]), assets.tile`finish`)) {
        clocks[i].setPosition(clocksPositions[i][0]*16+8, clocksPositions[i][1]*16+8);
        animation.runImageAnimation(clocks[i], assets.animation`ClockAnimation`, 120, true);
    }
    else{
        clocks[i].destroy();
    }
}

// Create player
let player = sprites.create(assets.image`PlayerRight`, SpriteKind.Player);
let startX = 24;
let startY = 24;
player.setPosition(startX, startY);
controller.moveSprite(player);
scene.cameraFollowSprite(player);

enum PlayerPos {
    Right,
    Left,
    Down,
    Up
}

let playerPos = PlayerPos.Down;
let playerPrePos = PlayerPos.Up;
let podminka = true;

game.onUpdate(function() {
    if (player.vx > 0) {
        playerPos = PlayerPos.Right;
    }
    else if (player.vx < 0) {
        playerPos = PlayerPos.Left;
    }
    if (player.vy > 0) {
        playerPos = PlayerPos.Down;
    }
    else if (player.vy < 0) {
        playerPos = PlayerPos.Up;
    }

    // Player Animations
    if (playerPrePos != playerPos) {
        switch (playerPos) {
            case PlayerPos.Right:
                animation.runImageAnimation(player, assets.animation`PlayerWalkRight`, 120, true);
                break;
            case PlayerPos.Left:
                animation.runImageAnimation(player, assets.animation`PlayerWalkLeft`, 120, true);
                break;
            case PlayerPos.Down:
                animation.runImageAnimation(player, assets.animation`PlayerWalkDown`, 120, true);
                break;
            case PlayerPos.Up:
                animation.runImageAnimation(player, assets.animation`PlayerWalkUp`, 120, true);
                break;
        }
    }

    else if (player.vx == 0 && player.vy == 0) {
        switch (playerPos) {
            case PlayerPos.Right:
                player.setImage(assets.image`PlayerRight`);
                break;
            case PlayerPos.Left:
                player.setImage(assets.image`PlayerLeft`);
                break;
            case PlayerPos.Down:
                player.setImage(assets.image`PlayerFront`);
                break;
            case PlayerPos.Up:
                player.setImage(assets.image`PlayerBack`);
                break;
        }
    }
    playerPrePos = playerPos;
})

// Winning the game
scene.onOverlapTile(SpriteKind.Player, assets.tile`finish`, function(sprite: Sprite, location: tiles.Location) {
    game.over(true, effects.starField);
})

let time = 20;
let clockTimeChange = 3;
info.startCountdown(time);

// Player collision with clock
sprites.onOverlap(SpriteKind.Player, SpriteKind.Clock, function(sprite: Sprite, otherSprite: Sprite) {
    otherSprite.startEffect(effects.fire);
    otherSprite.destroy();
    info.startCountdown(time-game.runtime()/1000+clockTimeChange);
    time += clockTimeChange;
})

game.splash("Find the end of the maze"); 