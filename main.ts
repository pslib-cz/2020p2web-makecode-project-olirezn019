scene.setBackgroundColor(0);
tiles.setTilemap(tilemap`maze1`);

// Create some additional spritekinds
namespace SpriteKind {
    export const Timer = SpriteKind.create();
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

// Maze generation algoritm
let count = 0;
let cells:Array<Array<number>> = [];
function generateMaze(x:number, y:number) {
    let unvisited;
    let ranCell;
    let nx;
    let ny;
    while (count != cols*rows-1) {
        newMaze[y][x] = 1;
        unvisited = unvisitedCells(x, y);
        if (unvisited.length == 0) {
            return;
        }
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

// Create player and player movement
let player = sprites.create(assets.image`Player`, SpriteKind.Player);
let startX = 24;
let startY = 24;
player.setPosition(startX, startY);
controller.moveSprite(player);
scene.cameraFollowSprite(player);

// Winning the game
scene.onOverlapTile(SpriteKind.Player, assets.tile`finish`, function(sprite: Sprite, location: tiles.Location) {
    game.over(true, effects.starField);
})

// box that starts the timer
let hidden = sprites.create(assets.image`startTimer`, SpriteKind.Timer);
hidden.z = -1;
//hidden.setFlag(SpriteFlag.Invisible, true);
if (tiles.tileAtLocationEquals(tiles.getTileLocation(1, 2), assets.tile`mazeTile`)) {
    hidden.setPosition(24, 40);
}
else hidden.setPosition(40, 24);

// If player collides with timer start or reset the time
sprites.onOverlap(SpriteKind.Player, SpriteKind.Timer, function(sprite: Sprite, otherSprite: Sprite) {
    info.startCountdown(25);
})

game.splash("Find the end of the maze"); 